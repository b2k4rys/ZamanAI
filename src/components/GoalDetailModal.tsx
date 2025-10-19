import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Goal } from "@/types/goal";
import { Clock, TrendingUp, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addContribution } from "@/lib/goalsRepository";

interface GoalDetailModalProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddContribution?: (amount: number, date: string) => void;
}

export const GoalDetailModal = ({ goal, open, onOpenChange, onAddContribution }: GoalDetailModalProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  if (!goal) return null;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-KZ").format(amount || 0);
  };

  const savedAmount = Number(goal.savedAmount) || 0;
  const targetAmount = Number(goal.targetAmount) || 0;
  const remaining = Math.max(0, targetAmount - savedAmount);
  const progressPercent = targetAmount > 0 ? Math.min(100, (savedAmount / targetAmount) * 100) : 0;
  const monthlyNeed = remaining > 0 ? Math.ceil(remaining / 12) : 0;

  const handleAddContribution = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректную сумму",
        variant: "destructive"
      });
      return;
    }

    try {
      addContribution(goal.id, amountNum);
      onAddContribution?.(amountNum, date);
      toast({
        title: "Пополнение добавлено",
        description: `${formatAmount(amountNum)} ₸ успешно добавлено к цели`
      });
      setShowAddForm(false);
      setAmount("");
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить пополнение",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>{goal.name}</span>
            <span className="text-lg font-normal text-muted-foreground">
              {formatAmount(savedAmount)} / {formatAmount(targetAmount)} ₸
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Осталось</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatAmount(remaining)} ₸
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">В месяц</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatAmount(monthlyNeed)} ₸
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <span className="text-sm">Прогресс</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {progressPercent.toFixed(0)}%
              </div>
            </Card>
          </div>

          {/* Add Contribution Section */}
          <Card className="p-4">
            <div className="space-y-4">
              {!showAddForm ? (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Добавить пополнение
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Сумма (₸)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Введите сумму"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Дата</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddContribution} className="flex-1">
                      Добавить
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false);
                        setAmount("");
                      }}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-4 bg-accent/50">
            <p className="text-sm text-muted-foreground">
              {remaining > 0 
                ? `💡 Чтобы достичь цели за 12 месяцев, откладывайте по ${formatAmount(monthlyNeed)} ₸ каждый месяц.`
                : '🎉 Поздравляем! Цель достигнута!'
              }
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
