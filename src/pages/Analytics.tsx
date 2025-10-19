import { useState } from "react";
import { ExpenseAnalytics } from "@/components/ExpenseAnalytics";
import { MerchantBreakdown } from "@/components/MerchantBreakdown";
import { SubscriptionsList } from "@/components/SubscriptionsList";
import { InsightsFeed } from "@/components/InsightsFeed";
import { TransactionManager } from "@/components/TransactionManager";
import { ReflectionModal } from "@/components/ReflectionModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transaction } from "@/types/transaction";
import { Goal } from "@/types/goal";
import { Sparkles } from "lucide-react";

interface AnalyticsProps {
  kpi: any;
  subscriptions: any[];
  topMerchants: any[];
  categoryBreakdown: any[];
  insights: any[];
  transactions?: Transaction[];
  goals?: Goal[];
  activeAnalyticsTab?: string;
  onAnalyticsTabChange?: (tab: string) => void;
  onInsightAction?: (action: string, insight: any) => void;
}

export const Analytics = ({
  kpi,
  subscriptions,
  topMerchants,
  categoryBreakdown,
  insights,
  transactions = [],
  goals = [],
  activeAnalyticsTab = "expenses",
  onAnalyticsTabChange,
  onInsightAction,
}: AnalyticsProps) => {
  const [localTab, setLocalTab] = useState(activeAnalyticsTab);
  const [reflectionOpen, setReflectionOpen] = useState(false);

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="expenses">Расходы</TabsTrigger>
          <TabsTrigger value="merchants">Мерчанты</TabsTrigger>
          <TabsTrigger value="subscriptions">Подписки</TabsTrigger>
          <TabsTrigger value="transactions">Транзакции</TabsTrigger>
          <TabsTrigger value="reflection">Reflection</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="mt-6">
          <div className="space-y-6">
            <ExpenseAnalytics 
              categories={categoryBreakdown} 
              totalSpend={kpi.totalSpend}
              transactions={transactions}
            />
            <InsightsFeed insights={insights} onAction={onInsightAction} />
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

        <TabsContent value="reflection" className="mt-6">
          <div className="space-y-6">
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">📊 Financial Reflection</h2>
              <p className="text-muted-foreground mb-6">
                Твой финансовый месяц в стиле Spotify Wrapped
              </p>
              <Button onClick={() => setReflectionOpen(true)} size="lg">
                Сформировать отчёт
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reflection Modal */}
      <ReflectionModal
        open={reflectionOpen}
        onOpenChange={setReflectionOpen}
        transactions={transactions}
        goals={goals}
        onAction={onInsightAction}
      />
    </div>
  );
};
