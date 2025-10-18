import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { GoalDetail } from "@/types/goal";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, Clock, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface GoalDetailModalProps {
  goalDetail: GoalDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddContribution?: (amount: number, date: string) => void;
}

export const GoalDetailModal = ({ goalDetail, open, onOpenChange, onAddContribution }: GoalDetailModalProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoSave, setAutoSave] = useState(false);
  const [period, setPeriod] = useState<"6m" | "12m" | "all">("all");
  const { toast } = useToast();

  if (!goalDetail) return null;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-KZ").format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", { 
      month: "short", 
      year: "numeric" 
    });
  };

  const remaining = goalDetail.goal.targetAmount - goalDetail.goal.currentAmount;
  const monthsRemaining = Math.ceil(remaining / goalDetail.goal.monthlyPlan);
  const progressPercent = (goalDetail.goal.currentAmount / goalDetail.goal.targetAmount) * 100;

  const filterDataByPeriod = () => {
    const now = new Date();
    const cutoffDate = new Date();
    
    if (period === "6m") {
      cutoffDate.setMonth(cutoffDate.getMonth() - 6);
    } else if (period === "12m") {
      cutoffDate.setMonth(cutoffDate.getMonth() - 12);
    } else {
      return { progress: goalDetail.progress, plan: goalDetail.plan };
    }
    
    return {
      progress: goalDetail.progress.filter(p => new Date(p.date) >= cutoffDate),
      plan: goalDetail.plan.filter(p => new Date(p.date) >= cutoffDate)
    };
  };

  const { progress, plan } = filterDataByPeriod();

  const chartData = [...progress.map(p => ({
    date: formatDate(p.date),
    fact: p.amount,
    plan: plan.find(pl => pl.date === p.date)?.amount || null
  })), ...plan.filter(pl => !progress.find(pr => pr.date === pl.date)).map(pl => ({
    date: formatDate(pl.date),
    fact: null,
    plan: pl.amount
  }))].sort((a, b) => a.date.localeCompare(b.date));

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

    onAddContribution?.(amountNum, date);
    toast({
      title: "Пополнение добавлено",
      description: `${formatAmount(amountNum)} ₸ успешно добавлено к цели`
    });
    setShowAddForm(false);
    setAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>{goalDetail.goal.title}</span>
            <span className="text-lg font-normal text-muted-foreground">
              {formatAmount(goalDetail.goal.currentAmount)} / {formatAmount(goalDetail.goal.targetAmount)} ₸
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Осталось накопить</p>
                  <p className="text-xl font-bold text-foreground">{formatAmount(remaining)} ₸</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent">
                  <Calendar className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Темп/месяц</p>
                  <p className="text-xl font-bold text-foreground">{formatAmount(goalDetail.goal.monthlyPlan)} ₸</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent">
                  <Clock className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ETA (месяцев)</p>
                  <p className="text-xl font-bold text-foreground">≈ {monthsRemaining}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart">График</TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              {/* Period Filter */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={period === "6m" ? "default" : "outline"}
                  onClick={() => setPeriod("6m")}
                >
                  6 месяцев
                </Button>
                <Button 
                  size="sm" 
                  variant={period === "12m" ? "default" : "outline"}
                  onClick={() => setPeriod("12m")}
                >
                  12 месяцев
                </Button>
                <Button 
                  size="sm" 
                  variant={period === "all" ? "default" : "outline"}
                  onClick={() => setPeriod("all")}
                >
                  Весь период
                </Button>
              </div>

              {/* Chart */}
              <Card className="p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Прогресс накоплений</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${formatAmount(value)} ₸`, '']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="plan" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      name="План"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fact" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Факт"
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Tips */}
              <Card className="p-4 shadow-card bg-accent">
                <p className="text-sm font-medium text-accent-foreground mb-2">💡 Совет ассистента</p>
                <p className="text-sm text-muted-foreground">{goalDetail.tips}</p>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4 text-foreground">История пополнений</h3>
                <div className="space-y-2">
                  {goalDetail.contributions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Пока нет пополнений
                    </p>
                  ) : (
                    goalDetail.contributions.map((contribution, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-accent-foreground">
                            {new Date(contribution.date).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </p>
                          {contribution.note && (
                            <p className="text-xs text-muted-foreground">{contribution.note}</p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-primary">
                          +{formatAmount(contribution.amount)} ₸
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="space-y-4">
            {showAddForm ? (
              <Card className="p-4 shadow-card space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Сумма пополнения</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Введите сумму"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
                  <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                    Отмена
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="flex gap-4">
                <Button 
                  className="flex-1 gap-2" 
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4" />
                  Пополнить
                </Button>
                <Card className="flex items-center gap-3 px-4 py-2 shadow-card">
                  <Label htmlFor="autosave" className="cursor-pointer text-sm">
                    Автосейв
                  </Label>
                  <Switch
                    id="autosave"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </Card>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
