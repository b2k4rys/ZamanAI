import { useState } from "react";
import { GoalCard } from "@/components/GoalCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface GoalsProps {
  contributions: Record<string, number>;
}

export const Goals = ({ contributions }: GoalsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            🎯 Мои цели
          </h1>
          <p className="text-muted-foreground mt-2">
            Отслеживайте прогресс накоплений и планируйте будущее
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить цель
        </Button>
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
