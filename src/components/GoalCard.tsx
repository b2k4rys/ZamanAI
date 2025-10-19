import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Plane, GraduationCap, Car, Plus, Shield, Heart, TrendingUp, Wallet, MoreVertical, Edit, Pause, Trash2 } from "lucide-react";
import { GoalDetailModal } from "./GoalDetailModal";
import { GoalProgressDonut } from "./GoalProgressDonut";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { getGoals } from "@/lib/goalsRepository";
import { Goal } from "@/types/goal";
import { formatAmount, getRiskBadge } from "@/lib/goalCalculations";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

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

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const getTypeEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      'Квартира': '🏠',
      'Хадж': '🕋',
      'Образование': '🎓',
      'Авто': '🚗',
      'Резерв': '🛡️',
      'Своя': '⭐',
    };
    return emojiMap[type] || '🎯';
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const savedAmount = Number(goal.savedAmount) || 0;
            const targetAmount = Number(goal.targetAmount) || 0;
            const progress = (goal.progress || 0) * 100;
            const remaining = Math.max(0, targetAmount - savedAmount);
            const Icon = iconMap[goal.icon as keyof typeof iconMap] || Home;
            const riskBadge = getRiskBadge(goal.riskFlag);

            return (
              <Card 
                key={goal.id} 
                className="group relative overflow-hidden transition-all hover:shadow-lg cursor-pointer"
                onClick={() => handleGoalClick(goal.id)}
              >
                {/* Gradient Cover */}
                <div 
                  className="absolute inset-0 h-24 opacity-10"
                  style={{
                    background: 'linear-gradient(135deg, #2D9A86 0%, #EEFE6D 100%)',
                  }}
                />

                <div className="relative p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-2xl flex-shrink-0">{getTypeEmoji(goal.type)}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base leading-tight text-foreground line-clamp-2 break-words">
                          {goal.name}
                        </h3>
                        {goal.type && (
                          <p className="text-xs text-muted-foreground mt-0.5">{goal.type}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <GoalProgressDonut goal={goal} size={60} />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Edit className="mr-2 h-4 w-4" />
                            Изменить
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Pause className="mr-2 h-4 w-4" />
                            Пауза
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Удалить цель?")) {
                                // deleteGoal(goal.id);
                              }
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {formatAmount(savedAmount)} / {formatAmount(targetAmount)} ₸
                      </span>
                      <span className="font-semibold text-foreground">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-accent/50 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Ежемесячно</p>
                      <p className="font-semibold text-foreground">{formatAmount(goal.monthlyPlan || 0)} ₸</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Осталось</p>
                      <p className="font-semibold text-foreground">
                        {goal.monthsLeft || 0} {goal.monthsLeft === 1 ? 'мес' : 'мес'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {goal.deadline && (
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(goal.deadline), 'd MMMM yyyy', { locale: ru })}
                      </span>
                      <Badge className={`text-xs ${riskBadge.color}`}>
                        {riskBadge.text}
                      </Badge>
                    </div>
                  )}

                  {/* Autosave Badges */}
                  {(goal.autosave?.roundups?.enabled || goal.autosave?.smartSave?.enabled || goal.autosave?.setAndForget?.enabled) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {goal.autosave.roundups?.enabled && (
                        <Badge variant="secondary" className="text-xs">🔄 Округление</Badge>
                      )}
                      {goal.autosave.smartSave?.enabled && (
                        <Badge className="text-xs bg-[#EEFE6D] text-[#2D9A86] border-[#2D9A86]/20">
                          💡 Smart Save
                        </Badge>
                      )}
                      {goal.autosave.setAndForget?.enabled && (
                        <Badge variant="secondary" className="text-xs">⏰ Авто</Badge>
                      )}
                    </div>
                  )}
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
        />
      )}
    </div>
  );
};
