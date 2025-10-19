import { GoalType } from './goal';

export type GoalTemplate = {
  id: string;
  type: GoalType;
  name: string;
  targetAmount: number;
  monthlyPlan: number;
  deadline: string; // ISO date or relative like "+12m"
  icon?: string;
  coverUrl?: string;
  tags?: string[];
  description?: string;
};
