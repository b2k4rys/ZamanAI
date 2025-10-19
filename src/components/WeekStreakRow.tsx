import { WeekView, DayState } from "@/types/challenge";
import { getWeekDayLabel } from "@/lib/challengeLogic";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WeekStreakRowProps {
  weekView: WeekView;
  onDayClick?: (dayIndex: number) => void;
}

export function WeekStreakRow({ weekView, onDayClick }: WeekStreakRowProps) {
  const getStateColor = (state: DayState) => {
    switch (state) {
      case 'done': return 'bg-primary text-primary-foreground';
      case 'missed': return 'bg-muted text-muted-foreground';
      case 'today': return 'bg-background border-2 border-primary text-foreground';
      case 'rest': return 'bg-muted/50 text-muted-foreground/50';
      default: return 'bg-muted';
    }
  };

  const getStateIcon = (state: DayState) => {
    switch (state) {
      case 'done': return <Check className="h-3 w-3" />;
      case 'missed': return <X className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1">
        <TooltipProvider>
          {weekView.days.map((day, idx) => (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDayClick?.(idx)}
                  disabled={day.state === 'rest'}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-full w-10 h-10 transition-all",
                    getStateColor(day.state),
                    day.state !== 'rest' && "hover:scale-110 cursor-pointer",
                    day.state === 'rest' && "cursor-not-allowed"
                  )}
                >
                  <span className="text-[10px] font-medium mb-0.5">
                    {getWeekDayLabel(day.w)}
                  </span>
                  {getStateIcon(day.state)}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  {day.state === 'done' && (
                    <p>Сэкономлено {day.saved?.toLocaleString() ?? 0} ₸</p>
                  )}
                  {day.state === 'missed' && <p>Пропущено</p>}
                  {day.state === 'today' && <p>Сегодня</p>}
                  {day.state === 'rest' && <p>Вне челленджа</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
