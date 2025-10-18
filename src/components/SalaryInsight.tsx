import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Wallet, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { goals } from "@/data/mockGoals";
import { SalaryRule, SalaryEvent } from "@/types/salary";
import { useToast } from "@/hooks/use-toast";

interface SalaryInsightProps {
  onContribute?: (goalId: string, amount: number, date: string) => void;
}

export const SalaryInsight = ({ onContribute }: SalaryInsightProps) => {
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [salaryEvent, setSalaryEvent] = useState<SalaryEvent | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState(goals[0]?.id || "");
  const [percent, setPercent] = useState(10);
  const [amount, setAmount] = useState(0);
  const { toast } = useToast();

  // Load rule from localStorage
  const [rule, setRule] = useState<SalaryRule>(() => {
    const stored = localStorage.getItem("zaman.salaryRule");
    if (stored) {
      return JSON.parse(stored);
    }
    return { enabled: false, percent: 10, goalId: goals[0]?.id || "" };
  });

  // Save rule to localStorage
  useEffect(() => {
    localStorage.setItem("zaman.salaryRule", JSON.stringify(rule));
  }, [rule]);

  // Calculate suggested amount when modal opens or percent changes
  useEffect(() => {
    if (salaryEvent) {
      const suggestedAmount = Math.round(salaryEvent.amount * percent / 100);
      setAmount(suggestedAmount);
    }
  }, [salaryEvent, percent]);

  const handleSimulateSalary = () => {
    const event: SalaryEvent = {
      amount: 250000,
      date: new Date().toISOString(),
      source: 'salary'
    };
    setSalaryEvent(event);
    setPercent(rule.enabled ? rule.percent : 10);
    setSelectedGoalId(rule.enabled ? rule.goalId : goals[0]?.id || "");
    setShowSuggestModal(true);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-KZ").format(amount);
  };

  const handleConfirm = () => {
    if (!salaryEvent) return;
    
    const goal = goals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    onContribute?.(selectedGoalId, amount, salaryEvent.date);
    
    toast({
      title: "Баракат растёт!",
      description: `Отложено ${formatAmount(amount)} ₸ на «${goal.title}»`
    });
    
    setShowSuggestModal(false);
  };

  const handleToggleAutosave = (checked: boolean) => {
    setRule(prev => ({ ...prev, enabled: checked }));
  };

  const handleUpdateRule = () => {
    setRule(prev => ({ ...prev, percent, goalId: selectedGoalId }));
    setShowRuleForm(false);
    toast({
      title: "Правило обновлено",
      description: `Автосейв ${percent}% на цель активирован`
    });
  };

  return (
    <>
      <Card className="p-6 shadow-card">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Salary Insight</h3>
          </div>

          <p className="text-sm text-muted-foreground">
            Отслеживаем поступления и мягко предлагаем пополнить цель.
          </p>

          <Button 
            className="w-full gap-2" 
            onClick={handleSimulateSalary}
            variant="outline"
          >
            <Wallet className="h-4 w-4" />
            Симулировать зарплату
          </Button>

          <div className="flex items-center justify-between pt-2 border-t">
            <Label htmlFor="autosave" className="cursor-pointer text-sm">
              Автосейв 10%
            </Label>
            <Switch
              id="autosave"
              checked={rule.enabled}
              onCheckedChange={handleToggleAutosave}
            />
          </div>

          {rule.enabled && (
            <div className="rounded-lg bg-accent p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Автосейв: {rule.percent}% от входящих поступлений на «
                {goals.find(g => g.id === rule.goalId)?.title}»
              </p>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowRuleForm(true)}
                className="h-7 text-xs gap-1"
              >
                <Settings className="h-3 w-3" />
                Изменить правило
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Suggest Modal */}
      <Dialog open={showSuggestModal} onOpenChange={setShowSuggestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Поступила зарплата {salaryEvent && formatAmount(salaryEvent.amount)} ₸ — альхамдулиллях!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Не хотите отложить {percent}% на вашу мечту?
            </p>

            <div className="space-y-2">
              <Label>Цель</Label>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Сумма пополнения (₸)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => {
                  const newAmount = parseFloat(e.target.value) || 0;
                  setAmount(newAmount);
                  if (salaryEvent) {
                    setPercent(Math.round(newAmount / salaryEvent.amount * 100));
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>% от зарплаты: {percent}%</Label>
              <Slider
                value={[percent]}
                onValueChange={([value]) => setPercent(value)}
                min={5}
                max={30}
                step={1}
              />
            </div>

            <div className="rounded-lg bg-accent p-3">
              <p className="text-xs text-accent-foreground">
                💡 <strong>Совет ассистента:</strong> Даже небольшие регулярные накопления приближают к цели. 
                Каждый шаг — это инвестиция в вашу мечту!
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirm} className="flex-1">
                Пополнить
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSuggestModal(false)}
                className="flex-1"
              >
                Позже
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Form Modal */}
      <Dialog open={showRuleForm} onOpenChange={setShowRuleForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Настроить правило автосейва</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Цель</Label>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Процент от поступлений: {percent}%</Label>
              <Slider
                value={[percent]}
                onValueChange={([value]) => setPercent(value)}
                min={5}
                max={30}
                step={1}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateRule} className="flex-1">
                Сохранить
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRuleForm(false)}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
