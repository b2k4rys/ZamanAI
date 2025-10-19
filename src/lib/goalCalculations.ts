import { Goal, RiskFlag } from '@/types/goal';
import { addMonths, differenceInMonths, parseISO } from 'date-fns';

/**
 * Calculate goal progress (0..1)
 */
export function calculateProgress(goal: Goal): number {
  const saved = Number(goal.savedAmount) || 0;
  const target = Number(goal.targetAmount) || 0;
  if (target === 0) return 0;
  return Math.min(1, Math.max(0, saved / target));
}

/**
 * Calculate months remaining to reach goal
 */
export function calculateMonthsLeft(goal: Goal): number {
  const remaining = (Number(goal.targetAmount) || 0) - (Number(goal.savedAmount) || 0);
  const monthly = Number(goal.monthlyPlan) || 0;
  if (monthly === 0 || remaining <= 0) return 0;
  return Math.ceil(remaining / monthly);
}

/**
 * Calculate projected completion date
 */
export function calculateProjectedDate(goal: Goal): Date {
  const monthsLeft = calculateMonthsLeft(goal);
  return addMonths(new Date(), monthsLeft);
}

/**
 * Calculate risk flag based on deadline
 */
export function calculateRiskFlag(goal: Goal): RiskFlag {
  if (!goal.deadline) return 'ok';
  
  try {
    const deadline = parseISO(goal.deadline);
    const projected = calculateProjectedDate(goal);
    const monthsSlip = differenceInMonths(projected, deadline);
    
    if (monthsSlip <= 0) return 'ok';
    if (monthsSlip <= 3) return 'at_risk';
    return 'off_track';
  } catch {
    return 'ok';
  }
}

/**
 * Enrich goal with computed fields
 */
export function enrichGoal(goal: Goal): Goal {
  return {
    ...goal,
    progress: calculateProgress(goal),
    monthsLeft: calculateMonthsLeft(goal),
    projectedDate: calculateProjectedDate(goal).toISOString(),
    riskFlag: calculateRiskFlag(goal),
  };
}

/**
 * Calculate total savings from history by source
 */
export function calculateSavingsBySource(goal: Goal): Record<string, number> {
  const bySource: Record<string, number> = {
    manual: 0,
    roundup: 0,
    smartSave: 0,
    setAndForget: 0,
    challenge: 0,
    salary: 0,
  };
  
  goal.history.forEach(entry => {
    if (entry.amount > 0) {
      bySource[entry.source] = (bySource[entry.source] || 0) + entry.amount;
    }
  });
  
  return bySource;
}

/**
 * Format amount with locale
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ru-KZ').format(Math.round(amount || 0));
}

/**
 * Get risk badge text and color
 */
export function getRiskBadge(riskFlag?: RiskFlag): { text: string; color: string } {
  switch (riskFlag) {
    case 'ok':
      return { text: 'В графике', color: 'bg-primary/10 text-primary' };
    case 'at_risk':
      return { text: 'Риск', color: 'bg-yellow-500/10 text-yellow-600' };
    case 'off_track':
      return { text: 'Отстаём', color: 'bg-destructive/10 text-destructive' };
    default:
      return { text: 'В графике', color: 'bg-primary/10 text-primary' };
  }
}

/**
 * Calculate what-if scenario
 */
export function calculateWhatIf(
  goal: Goal,
  newMonthlyPlan: number
): { monthsLeft: number; projectedDate: Date; savings: number } {
  const remaining = (Number(goal.targetAmount) || 0) - (Number(goal.savedAmount) || 0);
  const monthsLeft = Math.ceil(remaining / newMonthlyPlan);
  const projectedDate = addMonths(new Date(), monthsLeft);
  const currentMonthsLeft = calculateMonthsLeft(goal);
  const savings = currentMonthsLeft - monthsLeft;
  
  return { monthsLeft, projectedDate, savings };
}
