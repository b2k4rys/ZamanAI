export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  createdAt: string;
  updatedAt: string;
  icon?: string;
  status?: 'active' | 'completed' | 'paused';
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
