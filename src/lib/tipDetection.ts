import { Transaction } from "@/types/transaction";
import { Goal } from "@/types/goal";
import { Challenge } from "@/types/challenge";
import { Tip, TipType } from "@/types/tip";
import { differenceInDays, addDays, isSameDay } from "date-fns";
import { detectRecurringBills, estimateDaysToSalary, calculateAvgDailySpend, calculateBalance } from "./reminderDetection";
import { getUserProfile, generateBenchmarkInsights } from "./benchmarkEngine";

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
 * Fallback tips when no data-driven tips are available
 */
function getFallbackTips(): Tip[] {
  const now = new Date().toISOString();
  const today = new Date();
  
  return [
    {
      id: `tip_fallback_regular_${today.toISOString().split('T')[0]}`,
      type: 'saving_opportunity',
      title: 'Регулярность важнее суммы',
      body: 'Напоминаю: даже **3 000 ₸** каждую неделю лучше, чем 50 000 раз в квартал. Давай начнём с малого?',
      ts: now,
      actions: [
        { label: 'Посмотреть цели', action: { kind: 'open_budget_planner' } },
        { label: 'Позже', action: { kind: 'snooze', hours: 48 } }
      ],
      priority: 5,
    },
    {
      id: `tip_fallback_subs_${today.toISOString().split('T')[0]}`,
      type: 'duplicate_subs',
      title: 'Проверь подписки',
      body: 'Когда последний раз смотрел список подписок? Может, есть те, что давно не используешь? Проверим?',
      ts: now,
      actions: [
        { label: 'Показать подписки', action: { kind: 'open_subscriptions' } },
        { label: 'Напомнить через неделю', action: { kind: 'snooze', hours: 168 } }
      ],
      priority: 4,
    },
    {
      id: `tip_fallback_challenge_${today.toISOString().split('T')[0]}`,
      type: 'challenge_checkin',
      title: 'Мини-челлендж на 3 дня',
      body: '**3 дня без доставки еды** = примерно **+2 000 ₸** на цель. Звучит как план? Запустим? 🌿',
      ts: now,
      actions: [
        { label: 'Создать челлендж', action: { kind: 'create_challenge', scope: { kind: 'category', value: 'Еда' } } },
        { label: 'Не сейчас', action: { kind: 'snooze', hours: 72 } }
      ],
      priority: 6,
    },
    {
      id: `tip_fallback_deposit_${today.toISOString().split('T')[0]}`,
      type: 'saving_opportunity',
      title: 'Есть свободные деньги?',
      body: 'Если на счёте лежит лишнее, можно перевести часть на халяль-депозит под **15% годовых**. Посмотрим варианты?',
      ts: now,
      actions: [
        { label: 'Посмотреть продукты', action: { kind: 'open_budget_planner' } },
        { label: 'Не интересно', action: { kind: 'snooze', hours: 168 } }
      ],
      priority: 5,
    },
    {
      id: `tip_fallback_reminder_${today.toISOString().split('T')[0]}`,
      type: 'overspend',
      title: 'Еженедельный отчёт',
      body: 'Хочешь раз в неделю получать топ-3 категории расходов? Так легче контролировать бюджет 💚',
      ts: now,
      actions: [
        { label: 'Включить отчёты', action: { kind: 'open_budget_planner' } },
        { label: 'Нет, спасибо', action: { kind: 'snooze', hours: 168 } }
      ],
      priority: 4,
    },
  ];
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
        title: daysUntil === 0 ? `Сегодня списание` : `Завтра списание`,
        body: `${daysUntil === 0 ? 'Сегодня' : 'Завтра'} списание за **${bill.merchant}** на **${bill.amount.toLocaleString('ru-KZ')} ₸**. Переведу заранее, чтобы не забыть? 💚`,
        ts: now,
        actions: [
          { label: 'Оплатить сейчас', action: { kind: 'pay_bill', merchant: bill.merchant, amount: bill.amount } },
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
        title: `На карте осталось ${balance.toLocaleString('ru-KZ')} ₸`,
        body: `На карте осталось **${balance.toLocaleString('ru-KZ')} ₸**, а впереди **${daysToSalary} дней**. Обычно тратишь около **${Math.round(avgDaily).toLocaleString('ru-KZ')} ₸/день**. Давай распределим бюджет?`,
        ts: now,
        actions: [
          { label: 'Распределить бюджет', action: { kind: 'open_budget_planner' } },
          { label: 'Разберусь сам', action: { kind: 'snooze', hours: 24 } }
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
      const categoryMsg: Record<string, string> = {
        'Еда': 'Траты на еду',
        'Транспорт': 'Траты на транспорт',
        'Развлечения': 'Развлечения',
        'Покупки': 'Покупки',
        'Подписки': 'Подписки',
      };
      tips.push({
        id: `tip_overspend_${cat}_${today.toISOString().split('T')[0]}`,
        type: 'overspend',
        title: `${categoryMsg[cat] || cat}: рост на ${delta.toFixed(0)}%`,
        body: `**${categoryMsg[cat] || cat}** выросли на **${delta.toFixed(0)}%** по сравнению с прошлым месяцем. Хочешь ограничим или создадим челлендж для контроля?`,
        ts: now,
        actions: [
          { label: 'Создать челлендж', action: { kind: 'create_challenge', scope: { kind: 'category', value: cat } } },
          { label: 'Посмотрю позже', action: { kind: 'snooze', hours: 48 } }
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
      title: `Свободно примерно ${Math.round(freeCash).toLocaleString('ru-KZ')} ₸`,
      body: `Лежит свободно примерно **${Math.round(freeCash).toLocaleString('ru-KZ')} ₸**. Перекинуть часть на депозит под **15% годовых**?`,
      ts: now,
      actions: [
        { label: 'Посмотреть продукты', action: { kind: 'open_budget_planner' } },
        { label: 'Не сейчас', action: { kind: 'snooze', hours: 72 } }
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
    const remaining = target - saved;
    
    if (progress < 80 && missing > 1000) {
      const suggested = Math.round(missing);
      tips.push({
        id: `tip_goal_${goal.id}_${today.toISOString().split('T')[0]}`,
        type: 'goal_nudge',
        title: `До цели "${goal.name}"`,
        body: `До цели **«${goal.name}»** осталось **${remaining.toLocaleString('ru-KZ')} ₸**. В этом месяце пока не доложено **${suggested.toLocaleString('ru-KZ')} ₸**. Добавим немного сейчас?`,
        ts: now,
        actions: [
          { label: 'Пополнить цель', action: { kind: 'transfer_to_goal', goalId: goal.id, amount: suggested } },
          { label: 'В конце месяца', action: { kind: 'snooze', hours: 48 } }
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
        title: `Чек-ин по челленджу`,
        body: `Сегодня чек-ин по челленджу **«${challenge.title}»**. Уже справился? Засчитаем день! 🌿`,
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
      body: `Заметил две похожие подписки: **${duplicates.a}** и **${duplicates.b}**. Может, одну из них отключить?`,
      ts: now,
      actions: [
        { label: 'Показать подписки', action: { kind: 'open_subscriptions' } },
        { label: 'Всё нормально', action: { kind: 'snooze', hours: 168 } }
      ],
      priority: 4,
    });
  }

  // 8. Benchmark insights (if profile exists)
  const profile = getUserProfile();
  if (profile) {
    const benchmarkInsights = generateBenchmarkInsights(txns, profile);
    benchmarkInsights.forEach((insight, idx) => {
      tips.push({
        id: `tip_benchmark_${idx}_${today.toISOString().split('T')[0]}`,
        type: insight.includes('экономишь') ? 'saving_opportunity' : 'overspend',
        title: 'Сравнение с другими',
        body: insight,
        ts: now,
        actions: [
          { label: 'Посмотреть детали', action: { kind: 'open_budget_planner' } },
          { label: 'Позже', action: { kind: 'snooze', hours: 72 } }
        ],
        priority: 6,
      });
    });
  }

  // If no data-driven tips, return fallback tips
  if (tips.length === 0) {
    return getFallbackTips().slice(0, 2);
  }

  // Sort by priority and return top tips
  return tips.sort((a, b) => b.priority - a.priority).slice(0, 3);
}
