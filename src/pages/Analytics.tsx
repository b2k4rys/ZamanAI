import { useState } from "react";
import { ExpenseAnalytics } from "@/components/ExpenseAnalytics";
import { MerchantBreakdown } from "@/components/MerchantBreakdown";
import { SubscriptionsList } from "@/components/SubscriptionsList";
import { InsightsFeed } from "@/components/InsightsFeed";
import { TransactionManager } from "@/components/TransactionManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsProps {
  kpi: any;
  subscriptions: any[];
  topMerchants: any[];
  categoryBreakdown: any[];
  insights: any[];
  activeAnalyticsTab?: string;
  onAnalyticsTabChange?: (tab: string) => void;
}

export const Analytics = ({
  kpi,
  subscriptions,
  topMerchants,
  categoryBreakdown,
  insights,
  activeAnalyticsTab = "expenses",
  onAnalyticsTabChange,
}: AnalyticsProps) => {
  const [localTab, setLocalTab] = useState(activeAnalyticsTab);

  const handleTabChange = (tab: string) => {
    setLocalTab(tab);
    onAnalyticsTabChange?.(tab);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          📊 Аналитика
        </h1>
        <p className="text-muted-foreground mt-2">
          Анализ ваших расходов и финансовых привычек
        </p>
      </div>

      <Tabs value={localTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expenses">Расходы</TabsTrigger>
          <TabsTrigger value="merchants">Мерчанты</TabsTrigger>
          <TabsTrigger value="subscriptions">Подписки</TabsTrigger>
          <TabsTrigger value="transactions">Транзакции</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="mt-6">
          <div className="space-y-6">
            <ExpenseAnalytics 
              categories={categoryBreakdown} 
              totalSpend={kpi.totalSpend} 
            />
            <InsightsFeed insights={insights} />
          </div>
        </TabsContent>
        
        <TabsContent value="merchants" className="mt-6">
          <MerchantBreakdown 
            merchants={topMerchants}
            subscriptions={subscriptions.map(s => s.merchant)}
          />
        </TabsContent>
        
        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsList subscriptions={subscriptions} />
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-6">
          <TransactionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
