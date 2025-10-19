import { Challenge } from "@/types/challenge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WeekStreakRow } from "@/components/WeekStreakRow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  calcProgress, 
  daysRemaining, 
  getStatusColor, 
  getStatusVariant,
  targetFromBaseline 
} from "@/lib/challengeLogic";
import { Zap, Calendar, TrendingDown, Flame, MoreVertical, Pause, Trash2 } from "lucide-react";

interface ChallengeCardProps {
  challenge: Challenge;
  onViewDetails: (challenge: Challenge) => void;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ChallengeCard = ({ 
  challenge, 
  onViewDetails, 
  onPause, 
  onDelete,
}: ChallengeCardProps) => {
  const progress = calcProgress(challenge);
  const remaining = daysRemaining(challenge);
  const target = targetFromBaseline(challenge);
  const potential = challenge.baseline - target;

  const getScopeText = () => {
    if (challenge.scope.kind === 'category') {
      return `Категория: ${challenge.scope.value}`;
    } else {
      return `Место: ${challenge.scope.value}`;
    }
  };

  const hasAutoCheckinToday = challenge.checkins.some(c => {
    const checkinDate = new Date(c.date).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return checkinDate === today && c.auto && c.state === 'done';
  });

  return (
    <Card className="grid grid-rows-[auto_auto_1fr_auto] gap-3 p-4 sm:p-5 hover:shadow-lg transition-shadow relative">
      {/* Auto check-in notification */}
      {hasAutoCheckinToday && (
        <div className="absolute top-2 right-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <span>Авточек-ин 🌿</span>
        </div>
      )}
      
      {/* Header */}
      <header className="grid grid-cols-[1fr_auto] items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-primary" />
            <h3 
              className="font-semibold text-base text-foreground line-clamp-2 break-words hyphens-auto"
              title={challenge.title}
            >
              {challenge.title}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">{getScopeText()}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(challenge.status)} className={`${getStatusColor(challenge.status)} text-xs`}>
            {challenge.status === 'active' && 'Активный'}
            {challenge.status === 'paused' && 'На паузе'}
            {challenge.status === 'completed' && 'Завершен'}
            {challenge.status === 'failed' && 'Провален'}
          </Badge>
          
          {challenge.status === 'active' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onPause(challenge.id);
                }}>
                  <Pause className="mr-2 h-4 w-4" />
                  Пауза
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Удалить челлендж?")) {
                      onDelete(challenge.id);
                    }
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Content */}
      <section className="space-y-3">
        {/* Week Streak */}
        {challenge.status === 'active' && (
          <div className="space-y-2">
            <WeekStreakRow weekView={challenge.weekView} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-1 text-primary">
                <Flame className="h-3 w-3" />
                <span className="font-semibold">
                  Текущий стрик: {challenge.currentStreak} дн
                </span>
              </div>
              <div className="text-muted-foreground">
                Лучший: {challenge.bestStreak} дн
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-sm font-medium text-foreground">
              Сэкономлено: {challenge.saved.toLocaleString()} ₸
            </span>
            <span className="text-xs text-muted-foreground">
              {progress.toFixed(0)}%
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Цель: {potential.toLocaleString()} ₸</span>
            <span>Осталось: {Math.max(0, potential - challenge.saved).toLocaleString()} ₸</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Осталось: {remaining} дн</span>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <TrendingDown className="h-3 w-3" />
            <span>
              {challenge.target.mode === 'percent' 
                ? `−${challenge.target.value}%`
                : `−${challenge.target.value.toLocaleString()} ₸`
              }
            </span>
          </div>
        </div>

        {/* Hacks */}
        {challenge.hacks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {challenge.hacks.map((hack, idx) => {
              if (!hack.enabled) return null;
              let label = '';
              let className = 'text-xs py-0 px-2';
              
              switch (hack.type) {
                case 'roundups': 
                  label = `🔄 Округление`; 
                  break;
                case 'smart_save': 
                  label = `💡 Smart Save`;
                  className = 'text-xs py-1 px-3 bg-[#EEFE6D] text-[#2D9A86] border border-[#2D9A86]/30 hover:brightness-95';
                  break;
                case 'swear_jar': 
                  label = `⚠️ Штраф ${hack.penalty}₸`; 
                  break;
                case 'set_forget': 
                  label = `⏰ Авто`; 
                  break;
              }
              
              return hack.type === 'smart_save' ? (
                <span key={idx} className={`inline-flex items-center rounded-full ${className}`}>
                  {label}
                </span>
              ) : (
                <Badge key={idx} variant="secondary" className={className}>
                  {label}
                </Badge>
              );
            })}
          </div>
        )}
      </section>

      {/* Actions */}
      <footer className="pt-2 border-t">
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(challenge);
          }}
          className="w-full text-xs"
        >
          Детали
        </Button>
      </footer>
    </Card>
  );
};
