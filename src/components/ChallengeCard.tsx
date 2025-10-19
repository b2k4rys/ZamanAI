import { Challenge } from "@/types/challenge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  calcProgress, 
  daysRemaining, 
  getStatusColor, 
  getStatusVariant,
  targetFromBaseline 
} from "@/lib/challengeLogic";
import { Zap, Calendar, TrendingDown, MoreVertical } from "lucide-react";

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
  onDelete 
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

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
      <div onClick={() => onViewDetails(challenge)}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg text-foreground">
                {challenge.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">{getScopeText()}</p>
          </div>
          <Badge variant={getStatusVariant(challenge.status)} className={getStatusColor(challenge.status)}>
            {challenge.status === 'active' && 'Активный'}
            {challenge.status === 'paused' && 'На паузе'}
            {challenge.status === 'completed' && 'Завершен'}
            {challenge.status === 'failed' && 'Провален'}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Сэкономлено: {challenge.saved.toLocaleString()} ₸
              </span>
              <span className="text-sm text-muted-foreground">
                {progress.toFixed(0)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Цель: {potential.toLocaleString()} ₸
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Осталось: {remaining} дн</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <TrendingDown className="h-4 w-4" />
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
            <div className="flex flex-wrap gap-2">
              {challenge.hacks.map((hack, idx) => {
                if (!hack.enabled) return null;
                let label = '';
                switch (hack.type) {
                  case 'roundups': label = `🔄 Округление до ${hack.roundTo}₸`; break;
                  case 'smart_save': label = `💡 Smart Save`; break;
                  case 'swear_jar': label = `⚠️ Штраф ${hack.penalty}₸`; break;
                  case 'set_forget': label = `⏰ Авто ${hack.weekly}₸/нед`; break;
                }
                return (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(challenge);
          }}
        >
          Детали
        </Button>
        {challenge.status === 'active' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPause(challenge.id);
            }}
          >
            Пауза
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Удалить челлендж?")) {
              onDelete(challenge.id);
            }
          }}
          className="text-destructive"
        >
          Удалить
        </Button>
      </div>
    </Card>
  );
};
