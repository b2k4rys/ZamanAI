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
    <Card className="rounded-xl border border-border/50 bg-card p-4 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
      {/* Auto check-in notification */}
      {hasAutoCheckinToday && (
        <div className="absolute top-3 right-3 z-10 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
          <Zap className="h-3 w-3" />
          <span>Авточек-ин 🌿</span>
        </div>
      )}
      
      <div className="grid gap-3">
        {/* Header */}
        <header className="grid grid-cols-[1fr_auto] items-start gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="h-4 w-4 text-primary flex-shrink-0" />
              <h3 
                className="font-semibold text-lg leading-tight text-foreground line-clamp-2 break-words"
                style={{ hyphens: 'auto', wordBreak: 'break-word' }}
                title={challenge.title}
              >
                {challenge.title}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">{getScopeText()}</p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
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

        {/* Content */}
        <div className="space-y-3">
          {/* Week Streak */}
          {challenge.status === 'active' && (
            <div className="space-y-2">
              <WeekStreakRow weekView={challenge.weekView} />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-tight">
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
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">
                Сэкономлено: {challenge.saved.toLocaleString()} ₸
              </span>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-accent/50 overflow-hidden">
              <div 
                className="h-full rounded-full bg-[#EEFE6D] transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground leading-tight">
              <span>Цель: <span className="font-medium text-foreground">{potential.toLocaleString()}</span> ₸</span>
              <span>Осталось: <span className="font-medium text-foreground">{Math.max(0, potential - challenge.saved).toLocaleString()}</span> ₸</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs leading-tight">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Осталось: <span className="font-medium text-foreground">{remaining}</span> дн</span>
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <TrendingDown className="h-3.5 w-3.5" />
              <span className="font-medium">
                {challenge.target.mode === 'percent' 
                  ? `−${challenge.target.value}%`
                  : `−${challenge.target.value.toLocaleString()} ₸`
                }
              </span>
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#EEFE6D] text-[#2D9A86] border border-[#2D9A86]/20 px-3 py-1.5 text-xs font-medium hover:brightness-95 transition-all"
                  >
                    {label}
                  </span>
                ) : (
                  <Badge key={idx} variant="secondary" className="text-xs py-0.5 px-2.5">
                    {label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(challenge);
            }}
            className="w-full text-xs font-medium hover:bg-accent"
          >
            Детали
          </Button>
        </div>
      </div>
    </Card>
  );
};
