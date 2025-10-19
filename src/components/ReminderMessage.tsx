import { Reminder } from "@/types/reminder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, AlertCircle, Target, Zap, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ReminderMessageProps {
  reminder: Reminder;
  onActionClick: (action: Reminder['actions'][0]) => void;
}

export function ReminderMessage({ reminder, onActionClick }: ReminderMessageProps) {
  const getIcon = () => {
    switch (reminder.type) {
      case 'upcoming_bill': return <Calendar className="h-5 w-5" />;
      case 'low_balance': return <AlertCircle className="h-5 w-5" />;
      case 'goal_nudge': return <Target className="h-5 w-5" />;
      case 'challenge_checkin': return <Zap className="h-5 w-5" />;
      case 'duplicate_subs': return <Bell className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getPriorityColor = () => {
    if (reminder.priority >= 8) return 'border-l-4 border-l-destructive';
    if (reminder.priority >= 6) return 'border-l-4 border-l-primary';
    return 'border-l-4 border-l-muted-foreground';
  };

  return (
    <Card className={`p-4 ${getPriorityColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1 text-primary">
          {getIcon()}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="font-semibold text-foreground mb-1">
              {reminder.title}
            </h4>
            <div className="text-sm text-muted-foreground prose prose-sm">
              <ReactMarkdown>{reminder.body}</ReactMarkdown>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {reminder.actions.map((action, idx) => (
              <Button
                key={idx}
                variant={idx === 0 ? "default" : "outline"}
                size="sm"
                onClick={() => onActionClick(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
