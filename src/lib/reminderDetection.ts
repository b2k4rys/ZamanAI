import { Transaction } from "@/types/transaction";
import { Goal } from "@/types/goal";
import { Challenge } from "@/types/challenge";
import { Reminder, ReminderType } from "@/types/reminder";
import { isToday, addDays, differenceInDays, isSameDay } from "date-fns";

interface RecurringBill {
  merchant: string;
  amount: number;
  nextDate: string;
  confidence: number;
}

/**
 * Detect recurring bills (same merchant, similar amount, ~30 day period)
 */
export function detectRecurringBills(txns: Transaction[]): RecurringBill[] {
  const merchantGroups = new Map<string, Transaction[]>();
  
  // Group by merchant
  txns
    .filter(t => t.amount < 0) // only expenses
    .forEach(t => {
      const merchant = t.merchant || 'Без названия';
      if (!merchantGroups.has(merchant)) {
        merchantGroups.set(merchant, []);
      }
      merchantGroups.get(merchant)!.push(t);
    });

  const bills: RecurringBill[] = [];

  merchantGroups.forEach((transactions, merchant) => {
    if (transactions.length < 2) return;

    // Sort by date
    const sorted = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Look for patterns
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      
      const daysDiff = differenceInDays(new Date(curr.date), new Date(prev.date));
      const amountDiff = Math.abs(Math.abs(curr.amount) - Math.abs(prev.amount));
      const amountSimilarity = 1 - (amountDiff / Math.abs(prev.amount));

      // Check if it looks like a recurring bill (28-31 days, similar amount)
      if (daysDiff >= 28 && daysDiff <= 35 && amountSimilarity > 0.9) {
        // Predict next date
        const nextDate = addDays(new Date(curr.date), daysDiff);
        const daysUntil = differenceInDays(nextDate, new Date());

        if (daysUntil >= 0 && daysUntil <= 2) {
          bills.push({
            merchant,
            amount: Math.abs(curr.amount),
            nextDate: nextDate.toISOString(),
            confidence: amountSimilarity,
          });
        }
      }
    }
  });

  return bills;
}

/**
 * Estimate days until next salary based on transaction history
 */
export function estimateDaysToSalary(txns: Transaction[]): number {
  const salaries = txns
    .filter(t => t.amount > 100000) // likely salary
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (salaries.length < 2) return 30; // default

  const lastSalary = new Date(salaries[0].date);
  const prevSalary = new Date(salaries[1].date);
  const period = differenceInDays(lastSalary, prevSalary);
  
  const daysSinceLast = differenceInDays(new Date(), lastSalary);
  const daysUntilNext = period - daysSinceLast;

  return Math.max(0, daysUntilNext);
}

/**
 * Calculate average daily spending
 */
export function calculateAvgDailySpend(txns: Transaction[], days: number = 30): number {
  const cutoff = addDays(new Date(), -days);
  const recentExpenses = txns
    .filter(t => t.amount < 0 && new Date(t.date) >= cutoff)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return recentExpenses / days;
}

/**
 * Calculate current balance from transactions
 */
export function calculateBalance(txns: Transaction[]): number {
  return txns.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Generate reminders based on customer data
 */
export function generateReminders(
  txns: Transaction[],
  goals: Goal[],
  challenges: Challenge[]
): Reminder[] {
  const reminders: Reminder[] = [];
  const now = new Date().toISOString();

  // 1. Upcoming bills
  const bills = detectRecurringBills(txns);
  bills.forEach(bill => {
    const daysUntil = differenceInDays(new Date(bill.nextDate), new Date());
    if (daysUntil === 1) {
      reminders.push({
        id: `bill_${bill.merchant}_${bill.nextDate}`,
        type: 'upcoming_bill',
        title: `Завтра списание за ${bill.merchant}`,
        body: `Завтра списание за ${bill.merchant} **${bill.amount.toLocaleString()} ₸**. Переведу заранее, чтобы не забыть?`,
        ts: now,
        dueAt: bill.nextDate,
        actions: [
          { label: 'Перевести', action: { kind: 'pay_bill', merchant: bill.merchant, amount: bill.amount } },
          { label: 'Напомнить позже', action: { kind: 'snooze', hours: 24 } }
        ],
        state: 'new',
        priority: 8,
      });
    }
  });

  // 2. Low balance warning
  const balance = calculateBalance(txns);
  const daysToSalary = estimateDaysToSalary(txns);
  const avgDaily = calculateAvgDailySpend(txns);

  if (daysToSalary > 0 && balance > 0) {
    const dailyBudget = balance / daysToSalary;
    if (dailyBudget < avgDaily * 0.8) {
      reminders.push({
        id: `lowbal_${new Date().toISOString().split('T')[0]}`,
        type: 'low_balance',
        title: `Остаток ${balance.toLocaleString()} ₸ на ${daysToSalary} дн`,
        body: `На карте осталось **${balance.toLocaleString()} ₸**, впереди **${daysToSalary} дней** — давай распланируем бюджет, чтобы не перебрать?`,
        ts: now,
        actions: [
          { label: 'Распределить', action: { kind: 'open_budget_planner' } },
          { label: 'Позже', action: { kind: 'snooze', hours: 24 } }
        ],
        state: 'new',
        priority: 9,
      });
    }
  }

  // 3. Goal nudge
  goals.forEach(goal => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const monthlyTarget = goal.targetAmount / 12; // rough estimate
    
    if (progress < 50 && goal.currentAmount < monthlyTarget * 0.5) {
      const suggested = Math.round(monthlyTarget * 0.1);
      reminders.push({
        id: `goal_${goal.id}_${new Date().toISOString().split('T')[0]}`,
        type: 'goal_nudge',
        title: `Подкинуть на цель "${goal.title}"?`,
        body: `До цели **«${goal.title}»** не хватило отложить в этом месяце. Переведу ${suggested.toLocaleString()} ₸?`,
        ts: now,
        actions: [
          { label: 'Перевести', action: { kind: 'transfer_to_goal', goalId: goal.id, amount: suggested } },
          { label: 'Позже', action: { kind: 'snooze', hours: 48 } }
        ],
        state: 'new',
        priority: 5,
      });
    }
  });

  // 4. Challenge check-in
  const activeChallenges = challenges.filter(c => c.status === 'active');
  activeChallenges.forEach(challenge => {
    const todayCheckin = challenge.checkins.find(c => 
      isSameDay(new Date(c.date), new Date())
    );

    if (!todayCheckin) {
      reminders.push({
        id: `challenge_${challenge.id}_${new Date().toISOString().split('T')[0]}`,
        type: 'challenge_checkin',
        title: `Чек-ин по челленджу "${challenge.title}"`,
        body: `Сегодня чек-ин по челленджу **«${challenge.title}»**. Как дела? Отметим прогресс?`,
        ts: now,
        actions: [
          { label: 'Отметить', action: { kind: 'open_challenge_checkin', challengeId: challenge.id } },
          { label: 'Позже', action: { kind: 'snooze', hours: 12 } }
        ],
        state: 'new',
        priority: 6,
      });
    }
  });

  // Sort by priority
  return reminders.sort((a, b) => b.priority - a.priority);
}
