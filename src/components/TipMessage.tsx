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
    <Card className={`p-0 ${getPriorityColor()} bg-card shadow-card hover:shadow-elevated transition-all`}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#EEFE6D]/20">
            <div className="text-[#2D9A86]">
              {getIcon()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-[#EEFE6D]" />
              <span className="text-xs font-semibold text-primary">Совет от Zaman AI</span>
            </div>
            <h4 className="font-semibold text-[15px] text-foreground mb-2" style={{ lineHeight: '1.3' }}>
              {tip.title}
            </h4>
            <div className="text-[14px] text-muted-foreground prose prose-sm max-w-none" style={{ lineHeight: '1.4' }}>
              <ReactMarkdown>{tip.body}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-border/50 bg-muted/30 p-3">
        {tip.actions.map((action, idx) => (
          <Button
            key={idx}
            variant={idx === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => onActionClick(action)}
            className={idx === 0 ? "w-full bg-primary hover:bg-primary-hover" : "w-full hover:bg-accent"}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
