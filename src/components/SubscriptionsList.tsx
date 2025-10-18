import { Card } from "@/components/ui/card";
import { Subscription } from "@/types/transaction";
import { Calendar, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface SubscriptionsListProps {
  subscriptions: Subscription[];
}

export const SubscriptionsList = ({ subscriptions }: SubscriptionsListProps) => {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(
    Object.fromEntries(subscriptions.map(s => [s.merchant, s.active]))
  );
  
  const totalMonthly = subscriptions
    .filter(s => activeStates[s.merchant])
    .reduce((sum, s) => sum + s.avgAmount, 0);
  
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Подписки</h3>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Всего в месяц</p>
          <p className="font-bold text-primary">{totalMonthly.toLocaleString('ru-KZ')} ₸</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {subscriptions.map((sub) => (
          <div
            key={sub.merchant}
            className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
          >
            <div className="flex-1">
              <p className="font-medium text-foreground">{sub.merchant}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {sub.avgAmount.toLocaleString('ru-KZ')} ₸/мес
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Следующее: {new Date(sub.nextDate).toLocaleDateString('ru-KZ')}
                </span>
              </div>
            </div>
            
            <Switch
              checked={activeStates[sub.merchant]}
              onCheckedChange={(checked) => {
                setActiveStates(prev => ({ ...prev, [sub.merchant]: checked }));
              }}
            />
          </div>
        ))}
      </div>
      
      {subscriptions.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Подписки не обнаружены
        </p>
      )}
    </Card>
  );
};
