import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Goal } from "@/types/goal";
import { toast } from "@/hooks/use-toast";

interface GoalAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: Goal[];
  initialAmount: number;
  initialPercent: number;
  initialGoalId?: string;
  onConfirm: (goalId: string, amount: number) => void;
}

export const GoalAllocationDialog = ({
  open,
  onOpenChange,
  goals,
  initialAmount,
  initialPercent,
  initialGoalId,
  onConfirm,
}: GoalAllocationDialogProps) => {
  const [selectedGoalId, setSelectedGoalId] = useState(initialGoalId || goals[0]?.id || "");
  const [percent, setPercent] = useState(initialPercent);
  const [amount, setAmount] = useState(Math.round((initialAmount * initialPercent) / 100));

  useEffect(() => {
    if (open) {
      setSelectedGoalId(initialGoalId || goals[0]?.id || "");
      setPercent(initialPercent);
      setAmount(Math.round((initialAmount * initialPercent) / 100));
    }
  }, [open, initialGoalId, initialPercent, initialAmount, goals]);

  const handlePercentChange = (value: number[]) => {
    const newPercent = value[0];
    setPercent(newPercent);
    setAmount(Math.round((initialAmount * newPercent) / 100));
  };

  const handleAmountChange = (value: string) => {
    const newAmount = parseInt(value) || 0;
    setAmount(newAmount);
    setPercent(Math.round((newAmount / initialAmount) * 100));
  };

  const handleConfirm = () => {
    if (!selectedGoalId) {
      toast({
        title: "Ошибка",
        description: "Выберите цель для пополнения",
        variant: "destructive",
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: "Ошибка",
        description: "Сумма должна быть больше нуля",
        variant: "destructive",
      });
      return;
    }

    onConfirm(selectedGoalId, amount);

    const goal = goals.find((g) => g.id === selectedGoalId);
    toast({
      title: "Успешно!",
      description: `Отложено ${new Intl.NumberFormat("ru-KZ").format(amount)} ₸ на «${goal?.title}»`,
    });

    onOpenChange(false);
  };

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Куда отложить?</DialogTitle>
          <DialogDescription>
            Выберите цель и сумму для пополнения из зарплаты{" "}
            {new Intl.NumberFormat("ru-KZ").format(initialAmount)} ₸
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Цель</Label>
            <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
              <SelectTrigger id="goal">
                <SelectValue placeholder="Выберите цель" />
              </SelectTrigger>
              <SelectContent>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.icon} {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="percent">% от зарплаты</Label>
              <span className="text-sm font-semibold text-primary">{percent}%</span>
            </div>
            <Slider
              id="percent"
              min={5}
              max={30}
              step={1}
              value={[percent]}
              onValueChange={handlePercentChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5%</span>
              <span>30%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Сумма (₸)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              min={0}
              max={initialAmount}
            />
          </div>

          {selectedGoal && (
            <div className="rounded-lg bg-accent/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-accent-foreground">
                <span className="text-lg">{selectedGoal.icon}</span>
                {selectedGoal.title}
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Текущая сумма:</span>
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat("ru-KZ").format(selectedGoal.currentAmount)} ₸
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>После пополнения:</span>
                  <span className="font-semibold text-primary">
                    {new Intl.NumberFormat("ru-KZ").format(selectedGoal.currentAmount + amount)} ₸
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-2">
                  <span>Цель:</span>
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat("ru-KZ").format(selectedGoal.targetAmount)} ₸
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">
              💚 Каждый отложенный тенге приближает вас к мечте. Пусть ваши накопления будут благословенны!
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleConfirm} className="bg-primary hover:bg-primary-hover">
            Отложить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
