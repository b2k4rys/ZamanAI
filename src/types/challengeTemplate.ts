export type ChallengeTemplate = {
  id: string;
  title: string;
  place?: string;
  period: 'month' | 'week';
  targetAmount: number;
  defaultSaved?: number;
  icon?: string;
  note?: string;
  scope?: {
    kind: 'category' | 'merchant';
    value: string;
  };
};
