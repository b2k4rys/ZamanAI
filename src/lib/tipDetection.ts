import { Transaction } from "@/types/transaction";
import { Goal } from "@/types/goal";
import { Challenge } from "@/types/challenge";
import { Tip, TipType } from "@/types/tip";
import { differenceInDays, addDays, isSameDay } from "date-fns";
import { detectRecurringBills, estimateDaysToSalary, calculateAvgDailySpend, calculateBalance } from "./reminderDetection";

/**
 * Check if category has overspending
 */
export function detectCategoryOverspend(txns: Transaction[], category: string, thresholdPercent: number): number {
  const now = new Date();
  const currentMonth = txns.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.amount < 0;
  });
  
  const prevMonth = txns.filter(t => {
    const d = new Date(t.date);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear() && t.amount < 0;
  });

  const currentSpend = currentMonth
    .filter(t => t.category === category)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const prevSpend = prevMonth
    .filter(t => t.category === category)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (prevSpend === 0) return 0;
  
  const delta = ((currentSpend - prevSpend) / prevSpend) * 100;
  return delta >= thresholdPercent ? delta : 0;
}

/**
 * Calculate free cash (balance - upcoming bills - goal targets)
 */
export function calculateFreeCash(txns: Transaction[], goals: Goal[]): number {
  const balance = calculateBalance(txns);
  const bills = detectRecurringBills(txns);
  const upcomingBills = bills.reduce((sum, b) => sum + b.amount, 0);
  const goalTargets = goals
    .filter(g => !g.status || g.status === 'active')
    .reduce((sum, g) => sum + ((Number(g.targetAmount) || 0) - (Number(g.savedAmount) || 0)) * 0.1, 0);
  
  return balance - upcomingBills - goalTargets;
}

/**
 * Detect duplicate subscriptions (same category, similar amounts)
 */
export function detectDuplicateSubs(txns: Transaction[]): { a: string; b: string } | null {
  const subscriptions = txns.filter(t => 
    t.amount < 0 && 
    (t.category === 'Подписки' || t.note?.toLowerCase().includes('подписка'))
  );

  const merchants = new Map<string, number>();
  subscriptions.forEach(t => {
    const m = t.merchant || 'Без названия';
    merchants.set(m, (merchants.get(m) || 0) + 1);
  });

  const recurring = Array.from(merchants.entries())
    .filter(([_, count]) => count >= 2)
    .map(([m, _]) => m);

  if (recurring.length >= 2) {
    return { a: recurring[0], b: recurring[1] };
  }

  return null;
}

/**
 * Generate smart tips based on customer data
 */
export function generateSmartTips(
  txns: Transaction[],
  goals: Goal[],
  challenges: Challenge[]
): Tip[] {
  const tips: Tip[] = [];
  const now = new Date().toISOString();

  // 1. Upcoming bills
  const bills = detectRecurringBills(txns);
  bills.forEach(bill => {
    const daysUntil = differenceInDays(new Date(bill.nextDate), new Date());
    if (daysUntil === 1) {
      tips.push({
        id: `tip_bill_${bill.merchant}_${bill.nextDate}`,
        type: 'bill_upcoming',
        title: `Завтра списание за ${bill.merchant}`,
        body: `Завтра списание за ${bill.merchant} **${bill.amount.toLocaleString()} ₸**. Переведу заранее, чтобы не забыть?`,
        ts: now,
        actions: [
          { label: 'Оплатить', action: { kind: 'pay_bill', merchant: bill.merchant, amount: bill.amount } },
          { label: 'Напомнить завтра', action: { kind: 'snooze', hours: 24 } }
        ],
        priority: 8,
      });
    }
  });

  // 2. Low balance
  const balance = calculateBalance(txns);
  const daysToSalary = estimateDaysToSalary(txns);
  const avgDaily = calculateAvgDailySpend(txns);

  if (daysToSalary > 0 && balance > 0) {
    const dailyBudget = balance / daysToSalary;
    if (dailyBudget < avgDaily * 0.8) {
      tips.push({
        id: `tip_lowbal_${new Date().toISOString().split('T')[0]}`,
        type: 'low_balance',
        title: `Остаток ${balance.toLocaleString()} ₸ на ${daysToSalary} дн`,
        body: `Осталось **${balance.toLocaleString()} ₸**, впереди **${daysToSalary} дней**. Распределим по дням?`,
        ts: now,
        actions: [
          { label: 'Распределить бюджет', action: { kind: 'open_budget_planner' } },
          { label: 'Позже', action: { kind: 'snooze', hours: 24 } }
        ],
        priority: 9,
      });
    }
  }

  // 3. Category overspend
  const categories = ['Еда', 'Транспорт', 'Развлечения', 'Покупки'];
  categories.forEach(cat => {
    const delta = detectCategoryOverspend(txns, cat, 10);
    if (delta > 0) {
      tips.push({
        id: `tip_overspend_${cat}_${new Date().toISOString().split('T')[0]}`,
        type: 'overspend',
        title: `${cat} выросли на ${delta.toFixed(0)}%`,
        body: `Категория **${cat}** выросла на **${delta.toFixed(0)}%**. Хочешь лимит или челлендж?`,
        ts: now,
        actions: [
          { label: 'Поставить лимит', action: { kind: 'set_limit', category: cat, monthly: 50000 } },
          { label: 'Создать челлендж', action: { kind: 'create_challenge', scope: { kind: 'category', value: cat } } }
        ],
        priority: 6,
      });
    }
  });

  // 4. Saving opportunity
  const freeCash = calculateFreeCash(txns, goals);
  if (freeCash > 50000) {
    tips.push({
      id: `tip_saving_${new Date().toISOString().split('T')[0]}`,
      type: 'saving_opportunity',
      title: `Свободно ~${freeCash.toLocaleString()} ₸`,
      body: `Лежит свободно ~**${freeCash.toLocaleString()} ₸**. Переведём на халяль-депозит под 15%?`,
      ts: now,
      actions: [
        { label: 'Перевести на депозит', action: { kind: 'open_budget_planner' } },
        { label: 'Позже', action: { kind: 'snooze', hours: 48 } }
      ],
      priority: 5,
    });
  }

  // 5. Goal nudge
  goals.forEach(goal => {
    if (goal.status && goal.status !== 'active') return;
    const progress = ((Number(goal.savedAmount) || 0) / (Number(goal.targetAmount) || 1)) * 100;
    const monthlyTarget = (Number(goal.targetAmount) || 0) / 12;
    const missing = monthlyTarget * 0.5 - (Number(goal.savedAmount) || 0);
    
    if (progress < 50 && missing > 0) {
      const suggested = Math.round(missing);
      tips.push({
        id: `tip_goal_${goal.id}_${new Date().toISOString().split('T')[0]}`,
        type: 'goal_nudge',
        title: `До цели "${goal.name}" не хватает`,
        body: `До цели **«${goal.name}»** в этом месяце не доложили **${suggested.toLocaleString()} ₸**. Пополнить сейчас?`,
        ts: now,
        actions: [
          { label: 'Пополнить цель', action: { kind: 'transfer_to_goal', goalId: goal.id, amount: suggested } },
          { label: 'Позже', action: { kind: 'snooze', hours: 48 } }
        ],
        priority: 5,
      });
    }
  });

  // 6. Challenge check-in
  const activeChallenges = challenges.filter(c => c.status === 'active');
  activeChallenges.forEach(challenge => {
    const todayCheckin = challenge.checkins.find(c => 
      isSameDay(new Date(c.date), new Date())
    );

    if (!todayCheckin) {
      tips.push({
        id: `tip_challenge_${challenge.id}_${new Date().toISOString().split('T')[0]}`,
        type: 'challenge_checkin',
        title: `Чек-ин по "${challenge.title}"`,
        body: `Сегодня чек-ин по челленджу **«${challenge.title}»**. Отметим?`,
        ts: now,
        actions: [
          { label: 'Засчитать', action: { kind: 'open_budget_planner' } }, // Will be handled separately
          { label: 'Позже', action: { kind: 'snooze', hours: 12 } }
        ],
        priority: 6,
      });
    }
  });

  // 7. Duplicate subscriptions
  const duplicates = detectDuplicateSubs(txns);
  if (duplicates) {
    tips.push({
      id: `tip_dupsubs_${new Date().toISOString().split('T')[0]}`,
      type: 'duplicate_subs',
      title: `Две похожие подписки`,
      body: `Две похожие подписки: **${duplicates.a}** и **${duplicates.b}**. Одну отключим?`,
      ts: now,
      actions: [
        { label: 'Показать подписки', action: { kind: 'open_subscriptions' } },
        { label: 'Игнорировать', action: { kind: 'snooze', hours: 168 } } // week
      ],
      priority: 4,
    });
  }

  // Sort by priority
  return tips.sort((a, b) => b.priority - a.priority);
}
