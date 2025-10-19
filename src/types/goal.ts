export type GoalType = 'Квартира' | 'Хадж' | 'Образование' | 'Авто' | 'Резерв' | 'Своя';

export type GoalSource = 'manual' | 'roundup' | 'smartSave' | 'setAndForget' | 'challenge' | 'salary';

export type RiskFlag = 'ok' | 'at_risk' | 'off_track';

export type GoalHistory = {
  date: string;
  amount: number;
  source: GoalSource;
  note?: string;
};

export type AutosaveConfig = {
  roundups?: { enabled: boolean; roundTo: number };
  smartSave?: { enabled: boolean; dailyMax: number };
  setAndForget?: { enabled: boolean; monthly: number; dayOfMonth?: number };
};

export type Goal = {
  id: string;
  type: GoalType;
  name: string;
  targetAmount: number;
  savedAmount: number;
  monthlyPlan: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  currency: 'KZT';
  coverUrl?: string;
  tags?: string[];
  icon?: string;
  status?: 'active' | 'completed' | 'paused';
  autosave: AutosaveConfig;
  history: GoalHistory[];
  
  // Computed fields (cached)
  progress?: number;
  monthsLeft?: number;
  projectedDate?: string;
  riskFlag?: RiskFlag;
};

export type GoalPoint = { 
  date: string; 
  amount: number;
};

export type PlanPoint = { 
  date: string; 
  amount: number;
};

export type Contribution = {
  date: string;
  amount: number;
  note?: string;
};

export type GoalDetail = {
  goal: Goal;
  plan: PlanPoint[];
  progress: GoalPoint[];
  tips: string;
  contributions: Contribution[];
};
