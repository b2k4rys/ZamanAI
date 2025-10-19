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
    <div className="overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
      <div className="flex items-center gap-1.5 min-w-max">
        <TooltipProvider>
          {weekView.days.map((day, idx) => (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDayClick?.(idx)}
                  disabled={day.state === 'rest'}
                  style={{ scrollSnapAlign: 'start' }}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg w-6 h-6 transition-all border flex-shrink-0",
                    day.state === 'done' && "bg-[#E9F6F2] border-[#2D9A86] text-[#2D9A86]",
                    day.state === 'missed' && "bg-muted border-border text-muted-foreground",
                    day.state === 'today' && "bg-background border-2 border-primary text-foreground",
                    day.state === 'rest' && "bg-transparent border-[#E8EFEA] text-muted-foreground/50",
                    day.state !== 'rest' && "hover:scale-105 cursor-pointer",
                    day.state === 'rest' && "cursor-not-allowed"
                  )}
                >
                  <span className="text-[10px] font-medium">
                    {getWeekDayLabel(day.w)}
                  </span>
                  {day.state === 'done' && <Check className="h-2.5 w-2.5 absolute" />}
                  {day.state === 'missed' && <X className="h-2.5 w-2.5 absolute" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  {day.state === 'done' && (
                    <p>Сэкономлено {new Intl.NumberFormat('ru-KZ').format(day.saved ?? 0)} ₸</p>
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
