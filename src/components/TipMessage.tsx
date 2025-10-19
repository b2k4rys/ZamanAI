import { Tip } from "@/types/tip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, AlertCircle, Target, Zap, TrendingUp, CreditCard, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface TipMessageProps {
  tip: Tip;
  onActionClick: (action: Tip['actions'][0]) => void;
}

export function TipMessage({ tip, onActionClick }: TipMessageProps) {
  const getIcon = () => {
    switch (tip.type) {
      case 'bill_upcoming': return <CreditCard className="h-5 w-5" />;
      case 'low_balance': return <AlertCircle className="h-5 w-5" />;
      case 'overspend': return <TrendingUp className="h-5 w-5" />;
      case 'saving_opportunity': return <Target className="h-5 w-5" />;
      case 'goal_nudge': return <Target className="h-5 w-5" />;
      case 'challenge_checkin': return <Zap className="h-5 w-5" />;
      case 'duplicate_subs': return <Copy className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getPriorityColor = () => {
    if (tip.priority >= 8) return 'border-l-4 border-l-destructive';
    if (tip.priority >= 6) return 'border-l-4 border-l-primary';
    return 'border-l-4 border-l-muted-foreground';
  };

  return (
    <Card className={`p-4 ${getPriorityColor()} bg-muted/50`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1 text-primary">
          {getIcon()}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-solar" />
              {tip.title}
            </h4>
            <div className="text-sm text-muted-foreground prose prose-sm">
              <ReactMarkdown>{tip.body}</ReactMarkdown>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tip.actions.map((action, idx) => (
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
