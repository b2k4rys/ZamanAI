import { useState } from "react";
import { GoalCard } from "@/components/GoalCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Library } from "lucide-react";
import { GoalBankDialog } from "@/components/GoalBankDialog";
import { getGoalsBank } from "@/data/goalsBank";
import { addGoal } from "@/lib/goalsRepository";
import { toast } from "@/hooks/use-toast";

interface GoalsProps {
  contributions: Record<string, number>;
}

export const Goals = ({ contributions }: GoalsProps) => {
  const [bankOpen, setBankOpen] = useState(false);
  const templates = getGoalsBank();

  const handleAddFromBank = (templateIds: string[]) => {
    const selected = templates.filter((t) => templateIds.includes(t.id));
    
    selected.forEach((tpl) => {
      // Calculate deadline from relative format "+12m" or use as-is
      let deadline = tpl.deadline;
      if (deadline.startsWith("+")) {
        const months = parseInt(deadline.replace("+", "").replace("m", ""));
        const deadlineDate = new Date();
        deadlineDate.setMonth(deadlineDate.getMonth() + months);
        deadline = deadlineDate.toISOString().split("T")[0];
      }

      addGoal({
        type: tpl.type,
        name: tpl.name,
        targetAmount: tpl.targetAmount,
        savedAmount: 0,
        monthlyPlan: tpl.monthlyPlan,
        deadline,
        currency: "KZT",
        icon: tpl.icon,
        tags: tpl.tags,
        status: "active",
        autosave: {
          roundups: { enabled: false, roundTo: 100 },
          smartSave: { enabled: false, dailyMax: 2000 },
          setAndForget: { enabled: false, monthly: 0 },
        },
      });
    });

    toast({
      title: "Цели добавлены",
      description: `Добавлено целей: ${selected.length}`,
    });
  };

  return (
    <div className="space-y-6">
      <GoalBankDialog
        open={bankOpen}
        onOpenChange={setBankOpen}
        templates={templates}
        onAddSelected={handleAddFromBank}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            🎯 Мои цели
          </h1>
          <p className="text-muted-foreground mt-2">
            Отслеживайте прогресс накоплений и планируйте будущее
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setBankOpen(true)}>
            <Library className="h-4 w-4" />
            Выбрать из примеров
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить цель
          </Button>
        </div>
      </div>

      <GoalCard contributions={contributions} />

      <Card className="p-6 shadow-card">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">
            💡 Советы по достижению целей
          </h3>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg bg-accent p-4">
              <p className="font-medium text-accent-foreground">
                📊 Регулярность важнее размера взноса
              </p>
              <p className="mt-1 text-xs">
                Лучше откладывать понемногу каждый месяц, чем большие суммы раз в год
              </p>
            </div>
            
            <div className="rounded-lg bg-accent p-4">
              <p className="font-medium text-accent-foreground">
                🎯 Разделяйте большие цели на этапы
              </p>
              <p className="mt-1 text-xs">
                Промежуточные достижения помогают сохранять мотивацию
              </p>
            </div>
            
            <div className="rounded-lg bg-accent p-4">
              <p className="font-medium text-accent-foreground">
                💰 Автоматизируйте накопления
              </p>
              <p className="mt-1 text-xs">
                Настройте автоперевод части зарплаты на цели
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
