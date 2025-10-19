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
                className="relative overflow-hidden rounded-2xl bg-white border border-[#E8EFEA] hover:shadow-lg transition-shadow cursor-pointer"
                style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                onClick={() => handleGoalClick(goal.id)}
              >
                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-full bg-[#E9F6F2] flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">{getTypeEmoji(goal.type)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[16px] leading-tight text-[#1C2A27]">
                          {goal.name}
                        </h3>
                        {goal.type && (
                          <p className="text-[13px] text-[#6A7C76] mt-0.5">{goal.type}</p>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#E9F6F2]">
                          <MoreVertical className="h-4 w-4 text-[#2D9A86]" />
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

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[14px] text-[#6A7C76]">
                        {formatAmount(savedAmount)} / {formatAmount(targetAmount)} ₸
                      </span>
                      <Badge className="bg-[#EEFE6D] text-[#2D9A86] border-[#2D9A86]/20 font-semibold hover:bg-[#EEFE6D]">
                        {progress.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="h-3 w-full rounded-full bg-[#E9F6F2] overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[#EEFE6D] transition-all duration-500"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <p className="text-[13px] text-[#6A7C76]">
                      Осталось накопить: <span className="font-semibold text-[#1C2A27]">{formatAmount(remaining)} ₸</span>
                    </p>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8EFEA]">
                    <div className="space-y-1">
                      <p className="text-[13px] text-[#6A7C76]">Ежемесячно</p>
                      <p className="font-semibold text-[15px] text-[#1C2A27]">{formatAmount(goal.monthlyPlan || 0)} ₸</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[13px] text-[#6A7C76]">Осталось</p>
                      <p className="font-semibold text-[15px] text-[#1C2A27]">
                        {goal.monthsLeft || 0} мес
                      </p>
                    </div>
                  </div>

                  {/* Autosave Badges */}
                  {(goal.autosave?.roundups?.enabled || goal.autosave?.smartSave?.enabled || goal.autosave?.setAndForget?.enabled) && (
                    <div className="flex flex-wrap gap-1.5">
                      {goal.autosave.roundups?.enabled && (
                        <Badge variant="secondary" className="text-[11px] py-0.5 px-2">🔄 Округление</Badge>
                      )}
                      {goal.autosave.smartSave?.enabled && (
                        <Badge className="text-[11px] py-0.5 px-2 bg-[#EEFE6D] text-[#2D9A86] border-[#2D9A86]/20 hover:bg-[#EEFE6D]">
                          💡 Smart Save
                        </Badge>
                      )}
                      {goal.autosave.setAndForget?.enabled && (
                        <Badge variant="secondary" className="text-[11px] py-0.5 px-2">⏰ Авто</Badge>
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
