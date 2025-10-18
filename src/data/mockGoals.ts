import { Goal, GoalDetail, GoalPoint, PlanPoint, Contribution } from "@/types/goal";

export const goals: Goal[] = [
  { 
    id: "1", 
    title: "Квартира", 
    icon: "Home",
    targetAmount: 12000000, 
    currentAmount: 4500000, 
    deadline: "2027-06-01",
    monthlyPlan: 200000
  },
  { 
    id: "2", 
    title: "Хадж", 
    icon: "Plane",
    targetAmount: 2000000, 
    currentAmount: 800000, 
    deadline: "2026-03-01",
    monthlyPlan: 80000
  },
  { 
    id: "3", 
    title: "Образование", 
    icon: "GraduationCap",
    targetAmount: 3000000, 
    currentAmount: 1200000, 
    deadline: "2026-09-01",
    monthlyPlan: 100000
  },
  { 
    id: "4", 
    title: "Автомобиль", 
    icon: "Car",
    targetAmount: 8000000, 
    currentAmount: 2400000, 
    deadline: "2027-01-01",
    monthlyPlan: 180000
  },
];

const generatePlanData = (
  startAmount: number,
  targetAmount: number,
  monthlyPlan: number,
  deadline: string
): PlanPoint[] => {
  const plan: PlanPoint[] = [];
  const startDate = new Date();
  const endDate = new Date(deadline);
  
  let current = startAmount;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate && current < targetAmount) {
    plan.push({
      date: currentDate.toISOString().split('T')[0],
      amount: Math.min(current, targetAmount)
    });
    current += monthlyPlan;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  plan.push({
    date: endDate.toISOString().split('T')[0],
    amount: targetAmount
  });
  
  return plan;
};

const generateProgressData = (
  startAmount: number,
  currentAmount: number,
  monthlyPlan: number
): { progress: GoalPoint[], contributions: Contribution[] } => {
  const progress: GoalPoint[] = [];
  const contributions: Contribution[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  
  let current = startAmount;
  const currentDate = new Date(startDate);
  
  progress.push({
    date: currentDate.toISOString().split('T')[0],
    amount: current
  });
  
  while (current < currentAmount) {
    currentDate.setMonth(currentDate.getMonth() + 1);
    const variance = (Math.random() - 0.3) * monthlyPlan * 0.3;
    const contribution = Math.min(monthlyPlan + variance, currentAmount - current);
    
    if (contribution > 0) {
      current += contribution;
      progress.push({
        date: currentDate.toISOString().split('T')[0],
        amount: current
      });
      
      contributions.push({
        date: currentDate.toISOString().split('T')[0],
        amount: contribution,
        note: Math.random() > 0.7 ? "Автопополнение" : undefined
      });
    }
  }
  
  return { progress, contributions };
};

export const getGoalDetail = (goalId: string): GoalDetail | null => {
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return null;
  
  const plan = generatePlanData(
    goal.currentAmount,
    goal.targetAmount,
    goal.monthlyPlan,
    goal.deadline
  );
  
  const { progress, contributions } = generateProgressData(
    goal.currentAmount - (goal.monthlyPlan * 6),
    goal.currentAmount,
    goal.monthlyPlan
  );
  
  const remainingMonths = Math.ceil((goal.targetAmount - goal.currentAmount) / goal.monthlyPlan);
  const tips = remainingMonths > 12 
    ? "При текущем темпе вы достигнете цели раньше срока! Рассмотрите возможность открыть халяль-депозит для накопленной суммы."
    : "Вы идёте по плану! Продолжайте в том же духе, и ваша мечта станет реальностью.";
  
  return {
    goal,
    plan,
    progress,
    tips,
    contributions: contributions.reverse()
  };
};
