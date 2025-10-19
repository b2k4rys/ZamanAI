import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Home, Plane, GraduationCap, Car, Plus, Shield, Heart, TrendingUp, Wallet } from "lucide-react";
import { GoalDetailModal } from "./GoalDetailModal";
import { useState, useEffect } from "react";
import { getGoals } from "@/lib/goalsRepository";
import { Goal } from "@/types/goal";

const iconMap = {
  Home,
  Plane,
  GraduationCap,
  Car,
  Shield,
  Heart,
  TrendingUp,
  Wallet,
};

interface GoalCardProps {
  contributions?: Record<string, number>;
}

export const GoalCard = ({ contributions = {} }: GoalCardProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadGoals();
    
    // Subscribe to goals updates
    const handleGoalsUpdate = () => loadGoals();
    window.addEventListener('goals:updated', handleGoalsUpdate);
    return () => window.removeEventListener('goals:updated', handleGoalsUpdate);
  }, []);

  const loadGoals = () => {
    setGoals(getGoals());
  };

  const handleGoalClick = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsModalOpen(true);
  };

  const handleAddContribution = (amount: number, date: string) => {
    // Handled by modal
    console.log("Add contribution:", amount, date);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-KZ").format(amount || 0);
  };

  const getAdjustedAmount = (goalId: string, originalAmount: number) => {
    return (originalAmount || 0) + (contributions[goalId] || 0);
  };

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Мои цели</h2>
        <Button size="sm" className="gap-2 bg-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4" />
          Новая цель
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Целей пока нет. Создадим первую?
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить цель
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const savedAmount = Number(goal.savedAmount) || 0;
            const targetAmount = Number(goal.targetAmount) || 0;
            const adjustedAmount = getAdjustedAmount(goal.id, savedAmount);
            const progress = targetAmount > 0 ? (adjustedAmount / targetAmount) * 100 : 0;
            const Icon = iconMap[goal.icon as keyof typeof iconMap] || Home;

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
                        <h3 className="font-semibold text-foreground">{goal.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatAmount(adjustedAmount)} / {formatAmount(targetAmount)} ₸
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
                    {targetAmount > adjustedAmount 
                      ? `Осталось накопить: ${formatAmount(targetAmount - adjustedAmount)} ₸`
                      : 'Цель достигнута! 🎉'
                    }
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onAddContribution={handleAddContribution}
        />
      )}
    </div>
  );
};
