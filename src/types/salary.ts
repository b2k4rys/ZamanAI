export type SalaryRule = {
  enabled: boolean;
  percent: number; // 5..30, default 10
  goalId?: string; // куда копим
};

export type SalaryEvent = {
  amount: number;
  date: string; // ISO
  source?: 'salary' | 'bonus' | 'other';
};
