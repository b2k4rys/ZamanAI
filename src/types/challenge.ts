import { Category } from "./transaction";

export type SaveHackType = 'roundups' | 'smart_save' | 'swear_jar' | 'set_forget';

export type SaveHack = 
  | { type: 'roundups'; enabled: boolean; roundTo: number }
  | { type: 'smart_save'; enabled: boolean; dailyMax: number }
  | { type: 'swear_jar'; enabled: boolean; penalty: number }
  | { type: 'set_forget'; enabled: boolean; weekly: number };

export type ChallengeScope = 
  | { kind: 'category'; value: Category }
  | { kind: 'merchant'; value: string };

export type ChallengeTarget = {
  mode: 'percent' | 'amount';
  value: number;
};

export type ChallengeStatus = 'active' | 'paused' | 'failed' | 'completed';

export type ChallengeCheckin = {
  date: string;
  done: boolean;
  note?: string;
};

export type ChallengeAlert = {
  date: string;
  type: 'near_fail' | 'fail' | 'milestone';
  text: string;
};

export type Challenge = {
  id: string;
  title: string;
  scope: ChallengeScope;
  durationDays: 7 | 14 | 30;
  target: ChallengeTarget;
  startDate: string;
  endDate: string;
  baseline: number;
  saved: number;
  status: ChallengeStatus;
  hacks: SaveHack[];
  checkins: ChallengeCheckin[];
  alerts: ChallengeAlert[];
  goalId?: string;
};
