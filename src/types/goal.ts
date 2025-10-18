export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  monthlyPlan: number;
  icon: string;
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
