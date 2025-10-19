import { Customer } from "@/types/customer";
import { Goal } from "@/types/goal";
import { buildKPI, detectSubscriptions, getTopMerchants } from "./analytics";

export type CustomerSnapshot = {
  month: string;
  totalSpend: number;
  freeCash: number;
  byCategory: Record<string, number>;
  topMerchants: { name: string; amount: number; share: number }[];
  goals: { id: string; title: string; target: number; current: number; deadline?: string }[];
  subscriptions: { merchant: string; monthly: number; nextDate: string; active: boolean }[];
};

export function buildSnapshot(customer: Customer, goals: Goal[]): CustomerSnapshot {
  const kpi = buildKPI(customer.txns, customer.monthlyIncome);
  const subscriptions = detectSubscriptions(customer.txns);
  const topMerchants = getTopMerchants(kpi, 5);

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return {
    month,
    totalSpend: kpi.totalSpend,
    freeCash: kpi.freeCash,
    byCategory: kpi.byCategory,
    topMerchants: topMerchants.map(m => ({
      name: m.merchant,
      amount: m.amount,
      share: m.percentage,
    })),
    goals: goals.map(g => ({
      id: g.id,
      title: g.title,
      target: g.targetAmount,
      current: g.currentAmount,
      deadline: g.deadline,
    })),
    subscriptions: subscriptions.map(s => ({
      merchant: s.merchant,
      monthly: s.avgAmount,
      nextDate: s.nextDate,
      active: s.active,
    })),
  };
}

export type ActionCommand =
  | { type: 'show_expense_breakdown'; period?: 'week' | 'month' | 'year'; category?: string; merchant?: string }
  | { type: 'allocate_to_goal'; goalId: string; amount: number; source?: 'salary_insight' | 'manual' }
  | { type: 'create_goal'; title: string; target: number; deadline?: string }
  | { type: 'show_product_recs' }
  | { type: 'show_goals' }
  | { type: 'set_limit'; merchant: string; monthly: number }
  | { type: 'create_challenge'; scope: any; durationDays: 7 | 14 | 30; target: any; hacks: any[] }
  | { type: 'open_challenges' }
  | { type: 'checkin'; challengeId: string; note?: string; saved?: number }
  | { type: 'pay_bill'; merchant: string; amount: number }
  | { type: 'transfer_to_goal'; goalId: string; amount: number }
  | { type: 'open_budget_planner' }
  | { type: 'open_challenge_checkin'; challengeId: string };

export function parseAction(text: string): ActionCommand | null {
  const actionMarker = '@@ACTION';
  const idx = text.indexOf(actionMarker);
  if (idx === -1) return null;

  const jsonStart = idx + actionMarker.length;
  const jsonText = text.substring(jsonStart).trim();
  
  try {
    const parsed = JSON.parse(jsonText);
    return parsed as ActionCommand;
  } catch {
    return null;
  }
}
