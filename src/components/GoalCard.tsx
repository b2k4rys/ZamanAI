import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Home, Plane, GraduationCap, Car, Plus } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  icon: typeof Home;
  target: number;
  current: number;
  currency: string;
}

const goals: Goal[] = [
  { id: "1", title: "Квартира", icon: Home, target: 15000000, current: 4500000, currency: "₸" },
  { id: "2", title: "Хадж", icon: Plane, target: 2000000, current: 800000, currency: "₸" },
  { id: "3", title: "Образование", icon: GraduationCap, target: 3000000, current: 1200000, currency: "₸" },
  { id: "4", title: "Автомобиль", icon: Car, target: 8000000, current: 2400000, currency: "₸" },
];

export const GoalCard = () => {
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
          const progress = (goal.current / goal.target) * 100;
          const Icon = goal.icon;

          return (
            <Card key={goal.id} className="group overflow-hidden p-6 shadow-card transition-all hover:shadow-elevated">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{goal.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatAmount(goal.current)} / {formatAmount(goal.target)} {goal.currency}
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
                  Осталось накопить: {formatAmount(goal.target - goal.current)} {goal.currency}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
