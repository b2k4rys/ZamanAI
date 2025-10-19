export type TipType = 
  | 'bill_upcoming' 
  | 'low_balance' 
  | 'overspend' 
  | 'saving_opportunity' 
  | 'goal_nudge' 
  | 'challenge_checkin' 
  | 'duplicate_subs';

export type TipAction =
  | { kind: 'pay_bill'; merchant: string; amount: number }
  | { kind: 'open_budget_planner' }
  | { kind: 'create_challenge'; scope: { kind: 'category' | 'merchant'; value: string } }
  | { kind: 'set_limit'; category?: string; merchant?: string; monthly: number }
  | { kind: 'transfer_to_goal'; goalId: string; amount: number }
  | { kind: 'open_subscriptions' }
  | { kind: 'snooze'; hours: number };

export interface Tip {
  id: string;
  type: TipType;
  title: string;
  body: string;
  ts: string;
  actions: { label: string; action: TipAction }[];
  priority: number; // 1-10, higher = more important
  shown?: boolean;
}

export interface TipSettings {
  enabled: boolean;
  enabledTypes: Record<TipType, boolean>;
  preferredTime: string; // "09:30"
  autoTips: boolean; // показывать автоматически или только по кнопке
}
