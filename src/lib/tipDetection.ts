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
  const today = new Date();

  // 1. Upcoming bills
  const bills = detectRecurringBills(txns);
  bills.forEach(bill => {
    const daysUntil = differenceInDays(new Date(bill.nextDate), today);
    if (daysUntil <= 1 && daysUntil >= 0) {
      tips.push({
        id: `tip_bill_${bill.merchant}_${bill.nextDate}`,
        type: 'bill_upcoming',
        title: daysUntil === 0 ? `Сегодня списание за ${bill.merchant}` : `Завтра списание за ${bill.merchant}`,
        body: `${daysUntil === 0 ? 'Сегодня' : 'Завтра'} списание за **${bill.merchant}** на **${bill.amount.toLocaleString('ru-KZ')} ₸**. Переведу заранее?`,
        ts: now,
        actions: [
          { label: 'Оплатить', action: { kind: 'pay_bill', merchant: bill.merchant, amount: bill.amount } },
          { label: 'Напомнить завтра', action: { kind: 'snooze', hours: 24 } }
        ],
        priority: 9,
      });
    }
  });

  // 2. Low balance
  const balance = calculateBalance(txns);
  const daysToSalary = estimateDaysToSalary(txns);
  const avgDaily = calculateAvgDailySpend(txns);

  if (daysToSalary > 0 && balance > 0) {
    const dailyBudget = balance / daysToSalary;
    if (dailyBudget < avgDaily * 0.7) {
      tips.push({
        id: `tip_lowbal_${today.toISOString().split('T')[0]}`,
        type: 'low_balance',
        title: `Остаток ${balance.toLocaleString('ru-KZ')} ₸ на ${daysToSalary} дн`,
        body: `Осталось **${balance.toLocaleString('ru-KZ')} ₸** на **${daysToSalary} дней**. Средний дневной бюджет: **${Math.round(dailyBudget).toLocaleString('ru-KZ')} ₸** (обычно тратите ${Math.round(avgDaily).toLocaleString('ru-KZ')} ₸). Распределим?`,
        ts: now,
        actions: [
          { label: 'Распределить бюджет', action: { kind: 'open_budget_planner' } },
          { label: 'Позже', action: { kind: 'snooze', hours: 24 } }
        ],
        priority: 8,
      });
    }
  }

  // 3. Category overspend
  const categories = ['Еда', 'Транспорт', 'Развлечения', 'Покупки', 'Подписки'];
  categories.forEach(cat => {
    const delta = detectCategoryOverspend(txns, cat, 15);
    if (delta > 0) {
      tips.push({
        id: `tip_overspend_${cat}_${today.toISOString().split('T')[0]}`,
        type: 'overspend',
        title: `${cat}: рост на ${delta.toFixed(0)}%`,
        body: `Категория **${cat}** выросла на **${delta.toFixed(0)}%** относительно прошлого месяца. Хочешь установить лимит или создать челлендж для контроля?`,
        ts: now,
        actions: [
          { label: 'Создать челлендж', action: { kind: 'create_challenge', scope: { kind: 'category', value: cat } } },
          { label: 'Позже', action: { kind: 'snooze', hours: 48 } }
        ],
        priority: 6,
      });
    }
  });

  // 4. Saving opportunity
  const freeCash = calculateFreeCash(txns, goals);
  if (freeCash > 30000) {
    tips.push({
      id: `tip_saving_${today.toISOString().split('T')[0]}`,
      type: 'saving_opportunity',
      title: `Свободно ~${Math.round(freeCash).toLocaleString('ru-KZ')} ₸`,
      body: `Лежит свободно примерно **${Math.round(freeCash).toLocaleString('ru-KZ')} ₸**. Можем перевести часть на халяль-депозит под 15% годовых?`,
      ts: now,
      actions: [
        { label: 'Посмотреть продукты', action: { kind: 'open_budget_planner' } },
        { label: 'Позже', action: { kind: 'snooze', hours: 72 } }
      ],
      priority: 5,
    });
  }

  // 5. Goal nudge
  const activeGoals = goals.filter(g => !g.status || g.status === 'active');
  activeGoals.forEach(goal => {
    const saved = Number(goal.savedAmount) || 0;
    const target = Number(goal.targetAmount) || 0;
    const progress = (saved / target) * 100;
    const monthlyPlan = Number(goal.monthlyPlan) || 0;
    
    // Calculate how much is missing this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyContributions = (goal.history || [])
      .filter(h => new Date(h.date) >= monthStart)
      .reduce((sum, h) => sum + (h.amount || 0), 0);
    
    const missing = monthlyPlan - monthlyContributions;
    
    if (progress < 80 && missing > 1000) {
      const suggested = Math.round(missing);
      tips.push({
        id: `tip_goal_${goal.id}_${today.toISOString().split('T')[0]}`,
        type: 'goal_nudge',
        title: `До цели "${goal.name}" не хватает`,
        body: `До цели **«${goal.name}»** в этом месяце не доложено **${suggested.toLocaleString('ru-KZ')} ₸** (план: ${monthlyPlan.toLocaleString('ru-KZ')} ₸/мес). Пополнить сейчас?`,
        ts: now,
        actions: [
          { label: 'Пополнить цель', action: { kind: 'transfer_to_goal', goalId: goal.id, amount: suggested } },
          { label: 'Позже', action: { kind: 'snooze', hours: 48 } }
        ],
        priority: 7,
      });
    }
  });

  // 6. Challenge check-in
  const activeChallenges = challenges.filter(c => c.status === 'active');
  activeChallenges.forEach(challenge => {
    const todayCheckin = challenge.checkins.find(c => {
      const checkinDate = new Date(c.date);
      return checkinDate.getFullYear() === today.getFullYear() &&
             checkinDate.getMonth() === today.getMonth() &&
             checkinDate.getDate() === today.getDate();
    });

    if (!todayCheckin) {
      tips.push({
        id: `tip_challenge_${challenge.id}_${today.toISOString().split('T')[0]}`,
        type: 'challenge_checkin',
        title: `Чек-ин по "${challenge.title}"`,
        body: `Сегодня чек-ин по челленджу **«${challenge.title}»**. Уже справились с задачей? Отметим! 🌿`,
        ts: now,
        actions: [
          { label: 'Засчитать чек-ин', action: { kind: 'open_budget_planner' } },
          { label: 'Напомнить вечером', action: { kind: 'snooze', hours: 6 } }
        ],
        priority: 7,
      });
    }
  });

  // 7. Duplicate subscriptions
  const duplicates = detectDuplicateSubs(txns);
  if (duplicates) {
    tips.push({
      id: `tip_dupsubs_${today.toISOString().split('T')[0]}`,
      type: 'duplicate_subs',
      title: `Похожие подписки`,
      body: `Замечены две похожие подписки: **${duplicates.a}** и **${duplicates.b}**. Может, одну из них отключить?`,
      ts: now,
      actions: [
        { label: 'Показать подписки', action: { kind: 'open_subscriptions' } },
        { label: 'Игнорировать', action: { kind: 'snooze', hours: 168 } } // week
      ],
      priority: 4,
    });
  }

  // Sort by priority and return top tips
  return tips.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
