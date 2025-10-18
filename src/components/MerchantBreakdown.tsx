import { Card } from "@/components/ui/card";
import { MerchantBreakdown as TMerchantBreakdown } from "@/types/transaction";
import { TrendingUp, TrendingDown, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MerchantBreakdownProps {
  merchants: TMerchantBreakdown[];
  subscriptions?: string[];
}

export const MerchantBreakdown = ({ merchants, subscriptions = [] }: MerchantBreakdownProps) => {
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Топ мерчанты</h3>
      
      <div className="space-y-3">
        {merchants.map((merchant, index) => {
          const isSubscription = subscriptions.includes(merchant.merchant);
          const hasTrend = merchant.trend !== undefined;
          const trendUp = merchant.trend && merchant.trend > 0;
          
          return (
            <div
              key={merchant.merchant}
              className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {index + 1}. {merchant.merchant}
                    </p>
                    {isSubscription && (
                      <Badge variant="secondary" className="text-xs">
                        Подписка
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {merchant.percentage.toFixed(1)}% бюджета
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {merchant.amount.toLocaleString('ru-KZ')} ₸
                </p>
                {hasTrend && (
                  <div className={`flex items-center gap-1 text-xs ${
                    trendUp ? 'text-destructive' : 'text-primary'
                  }`}>
                    {trendUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(merchant.trend!).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
