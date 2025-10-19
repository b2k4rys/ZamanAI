export type ReminderType = 
  | 'upcoming_bill' 
  | 'low_balance' 
  | 'goal_nudge' 
  | 'challenge_checkin' 
  | 'duplicate_subs';

export type ReminderAction =
  | { kind: 'pay_bill'; merchant: string; amount: number }
  | { kind: 'transfer_to_goal'; goalId: string; amount: number }
  | { kind: 'open_budget_planner' }
  | { kind: 'open_challenge_checkin'; challengeId: string }
  | { kind: 'snooze'; hours: number }
  | { kind: 'dismiss' };

export type ReminderState = 'new' | 'shown' | 'snoozed' | 'done' | 'dismissed';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  body: string;
  ts: string;
  dueAt?: string;
  actions: { label: string; action: ReminderAction }[];
  state: ReminderState;
  priority: number; // 1-10, higher = more important
}

export interface ReminderSettings {
  enabled: boolean;
  enabledTypes: Record<ReminderType, boolean>;
  preferredTime: string; // "09:30"
  language: 'ru' | 'kk';
}
