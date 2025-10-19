import { Card } from "@/components/ui/card";
import { Insight } from "@/types/transaction";
import { Lightbulb, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InsightsFeedProps {
  insights: Insight[];
  onAction?: (action: string, insight: Insight) => void;
}

export const InsightsFeed = ({ insights, onAction }: InsightsFeedProps) => {
  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'good':
      case 'saving':
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case 'warning':
      case 'alert':
      case 'overspend':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'tip':
      case 'habit':
      case 'investment':
      case 'goal':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };
  
  const getBgClass = (type: Insight['type']) => {
    switch (type) {
      case 'good':
      case 'saving':
        return 'bg-primary/5 border-primary/20';
      case 'warning':
      case 'alert':
      case 'overspend':
        return 'bg-destructive/5 border-destructive/20';
      case 'tip':
      case 'habit':
      case 'investment':
      case 'goal':
        return 'bg-yellow-500/5 border-yellow-500/20';
    }
  };
  
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Инсайты и рекомендации</h3>
      
      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg border ${getBgClass(insight.type)} transition-colors`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getIcon(insight.type)}
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-foreground leading-relaxed">
                  {insight.text}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {insight.category && (
                    <Badge variant="outline">
                      {insight.category}
                    </Badge>
                  )}
                  {insight.delta && (
                    <Badge variant={insight.delta > 0 ? "destructive" : "default"}>
                      {insight.delta > 0 ? '+' : ''}{insight.delta.toFixed(0)}%
                    </Badge>
                  )}
                </div>
                
                {insight.suggestedAction && insight.actionable && (
                  <div className="mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onAction?.(insight.suggestedAction!, insight)}
                      className="text-xs"
                    >
                      {insight.suggestedAction}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {insights.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Нет новых инсайтов
        </p>
      )}
    </Card>
  );
};
