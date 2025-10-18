import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Home, Plane, GraduationCap, Car, Plus } from "lucide-react";
import { GoalDetailModal } from "./GoalDetailModal";
import { useState } from "react";
import { goals } from "@/data/mockGoals";
import { getGoalDetail } from "@/data/mockGoals";
import { GoalDetail } from "@/types/goal";

const iconMap = {
  Home,
  Plane,
  GraduationCap,
  Car,
};

export const GoalCard = () => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalDetail, setGoalDetail] = useState<GoalDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGoalClick = (goalId: string) => {
    const detail = getGoalDetail(goalId);
    if (detail) {
      setGoalDetail(detail);
      setSelectedGoalId(goalId);
      setIsModalOpen(true);
    }
  };

  const handleAddContribution = (amount: number, date: string) => {
    // In a real app, this would update the backend
    // For now, just close the modal
    console.log("Add contribution:", amount, date);
  };
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-KZ").format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Мои цели</h2>
        <Button size="sm" className="gap-2 bg-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4" />
          Новая цель
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const Icon = iconMap[goal.icon as keyof typeof iconMap];

          return (
            <Card 
              key={goal.id} 
              className="group overflow-hidden p-6 shadow-card transition-all hover:shadow-elevated cursor-pointer"
              onClick={() => handleGoalClick(goal.id)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{goal.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)} ₸
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full bg-secondary px-3 py-1">
                    <span className="text-xs font-semibold text-secondary-foreground">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <Progress value={progress} className="h-2" />

                <div className="text-xs text-muted-foreground">
                  Осталось накопить: {formatAmount(goal.targetAmount - goal.currentAmount)} ₸
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <GoalDetailModal
        goalDetail={goalDetail}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddContribution={handleAddContribution}
      />
    </div>
  );
};
