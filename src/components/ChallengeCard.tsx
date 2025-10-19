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

  // Format numbers consistently
  const formatAmount = (n: number) => {
    return new Intl.NumberFormat('ru-KZ').format(Math.max(0, n));
  };

  return (
    <Card className="rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden min-w-[340px] h-full">
      {/* Auto check-in notification */}
      {hasAutoCheckinToday && (
        <div className="absolute top-3 right-3 z-10 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
          <Zap className="h-3 w-3" />
          <span>Авточек-ин 🌿</span>
        </div>
      )}
      
      <div className="grid grid-rows-[auto_auto_auto_1fr_auto] gap-2.5 p-4 sm:p-5 h-full">
        {/* Header */}
        <header className="grid grid-cols-[auto_1fr_auto] gap-3 items-start">
          {challenge.icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#E9F6F2] flex items-center justify-center text-[24px]">
              {challenge.icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!challenge.icon && <Zap className="h-4 w-4 text-primary flex-shrink-0" />}
              <h3 
                className="font-semibold text-[18px] leading-snug text-foreground break-words"
                style={{ hyphens: 'auto', wordBreak: 'normal', lineHeight: '1.2' }}
                title={challenge.title}
              >
                {challenge.title}
              </h3>
            </div>
            <p className="text-[13px] text-muted-foreground leading-[1.3]">{getScopeText()}</p>
          </div>
          
          <div className="flex items-start gap-2 flex-shrink-0 self-start justify-self-end">
            <Badge variant={getStatusVariant(challenge.status)} className={`${getStatusColor(challenge.status)} text-xs whitespace-nowrap`}>
              {challenge.status === 'active' && 'Активный'}
              {challenge.status === 'paused' && 'На паузе'}
              {challenge.status === 'completed' && 'Завершен'}
              {challenge.status === 'failed' && 'Провален'}
            </Badge>
            
            {challenge.status === 'active' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
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

        {/* Week Streak */}
        {challenge.status === 'active' && (
          <div className="space-y-2">
            <WeekStreakRow weekView={challenge.weekView} />
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px]" style={{ lineHeight: '1.3' }}>
              <div className="flex items-center gap-1.5 text-primary">
                <Flame className="h-3.5 w-3.5" />
                <span className="font-semibold">
                  Текущий стрик: {challenge.currentStreak} дн
                </span>
              </div>
              <div className="text-muted-foreground">
                Лучший: <span className="font-medium">{challenge.bestStreak}</span> дн
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[15px] font-medium text-foreground" style={{ lineHeight: '1.2' }}>
              Сэкономлено: {formatAmount(challenge.saved)} ₸
            </span>
            <span className="text-[13px] font-semibold text-muted-foreground tabular-nums w-14 text-right" style={{ lineHeight: '1.3' }}>
              {Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress)).toFixed(0)}%
            </span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-[#E9F6F2] overflow-hidden">
            <div 
              className="h-full rounded-full bg-[#EEFE6D] transition-[width] duration-400 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress))}%` }}
            />
          </div>
          
          {/* Meta row 1: Goal and Remaining */}
          <div className="grid grid-cols-2 gap-2 text-[13px] text-muted-foreground" style={{ lineHeight: '1.3' }}>
            <span>Цель: <span className="font-semibold text-foreground">{formatAmount(potential)}</span> ₸</span>
            <span className="text-right">Осталось: <span className="font-semibold text-foreground">{formatAmount(potential - challenge.saved)}</span> ₸</span>
          </div>
          
          {/* Meta row 2: Days and Target */}
          <div className="flex items-center gap-4 text-[13px]" style={{ lineHeight: '1.3' }}>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Осталось: <span className="font-semibold text-foreground">{remaining}</span> дн</span>
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <TrendingDown className="h-3.5 w-3.5" />
              <span className="font-semibold">
                {challenge.target.mode === 'percent' 
                  ? `−${challenge.target.value}%`
                  : `−${formatAmount(challenge.target.value)} ₸`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Hacks */}
        {challenge.hacks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {challenge.hacks.map((hack, idx) => {
              if (!hack.enabled) return null;
              let label = '';
              
              switch (hack.type) {
                case 'roundups': 
                  label = `🔄 Округление`; 
                  break;
                case 'smart_save': 
                  label = `💡 Smart Save`;
                  break;
                case 'swear_jar': 
                  label = `⚠️ Штраф ${hack.penalty}₸`; 
                  break;
                case 'set_forget': 
                  label = `⏰ Авто`; 
                  break;
              }
              
              return hack.type === 'smart_save' ? (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#EEFE6D] text-[#2D9A86] border border-[#2D9A86]/30 px-3 py-1.5 text-[14px] font-medium hover:brightness-95 active:translate-y-[0.5px] transition-all"
                >
                  {label}
                </span>
              ) : (
                <Badge key={idx} variant="secondary" className="text-xs py-1 px-2.5">
                  {label}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="pt-2">
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(challenge);
            }}
            className="w-full h-9 text-[14px] font-medium border-[#E8EFEA] bg-white hover:bg-[#F7FBF9]"
          >
            Детали
          </Button>
        </div>
      </div>
    </Card>
  );
};
