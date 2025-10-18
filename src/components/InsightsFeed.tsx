import { Card } from "@/components/ui/card";
import { Insight } from "@/types/transaction";
import { Lightbulb, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InsightsFeedProps {
  insights: Insight[];
}

export const InsightsFeed = ({ insights }: InsightsFeedProps) => {
  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'good':
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };
  
  const getBgClass = (type: Insight['type']) => {
    switch (type) {
      case 'good':
        return 'bg-primary/5 border-primary/20';
      case 'warning':
        return 'bg-destructive/5 border-destructive/20';
      case 'tip':
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
                {insight.category && (
                  <Badge variant="outline" className="mt-2">
                    {insight.category}
                  </Badge>
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
