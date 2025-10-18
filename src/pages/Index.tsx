import { Navbar } from "@/components/Navbar";
import { ChatAssistant } from "@/components/ChatAssistant";
import { GoalCard } from "@/components/GoalCard";
import { ExpenseAnalytics } from "@/components/ExpenseAnalytics";
import { MerchantBreakdown } from "@/components/MerchantBreakdown";
import { SubscriptionsList } from "@/components/SubscriptionsList";
import { InsightsFeed } from "@/components/InsightsFeed";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { CustomerSelector } from "@/components/CustomerSelector";
import { TransactionManager } from "@/components/TransactionManager";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { goals } from "@/data/mockGoals";
import { useCustomer } from "@/contexts/CustomerContext";
import { buildKPI, detectSubscriptions, getTopMerchants, getCategoryBreakdown, generateInsights } from "@/lib/analytics";

const Index = () => {
  const [goalContributions, setGoalContributions] = useState<Record<string, number>>({});
  const { activeCustomer } = useCustomer();

  const handleContribute = (goalId: string, amount: number, date: string) => {
    setGoalContributions(prev => ({
      ...prev,
      [goalId]: (prev[goalId] || 0) + amount
    }));
  };

  // Calculate analytics from active customer transactions (memoized for performance)
  const analytics = useMemo(() => {
    const kpi = buildKPI(activeCustomer.txns, activeCustomer.monthlyIncome);
    const subscriptions = detectSubscriptions(activeCustomer.txns);
    const topMerchants = getTopMerchants(kpi, 5);
    const categoryBreakdown = getCategoryBreakdown(kpi);
    const insights = generateInsights(kpi, subscriptions);
    
    return { kpi, subscriptions, topMerchants, categoryBreakdown, insights };
  }, [activeCustomer]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Selector */}
            <CustomerSelector />

            <Card className="overflow-hidden shadow-card">
              <ChatAssistant goals={goals} onContribute={handleContribute} />
            </Card>

            <GoalCard contributions={goalContributions} />
            
            {/* Analytics Tabs */}
            <Tabs defaultValue="expenses" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="expenses">Расходы</TabsTrigger>
                <TabsTrigger value="merchants">Мерчанты</TabsTrigger>
                <TabsTrigger value="subscriptions">Подписки</TabsTrigger>
                <TabsTrigger value="transactions">Транзакции</TabsTrigger>
              </TabsList>
              
              <TabsContent value="expenses" className="mt-6">
                <div className="space-y-6">
                  <ExpenseAnalytics 
                    categories={analytics.categoryBreakdown} 
                    totalSpend={analytics.kpi.totalSpend} 
                  />
                  <InsightsFeed insights={analytics.insights} />
                </div>
              </TabsContent>
              
              <TabsContent value="merchants" className="mt-6">
                <MerchantBreakdown 
                  merchants={analytics.topMerchants}
                  subscriptions={analytics.subscriptions.map(s => s.merchant)}
                />
              </TabsContent>
              
              <TabsContent value="subscriptions" className="mt-6">
                <SubscriptionsList subscriptions={analytics.subscriptions} />
              </TabsContent>
              
              <TabsContent value="transactions" className="mt-6">
                <TransactionManager />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <ProductRecommendations />

            <Card className="p-6 shadow-card">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary breath-animation" />
                  <h3 className="font-semibold text-foreground">Советы для спокойствия</h3>
                </div>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-lg bg-accent p-3">
                    <p className="font-medium text-accent-foreground">🌬️ Дыхательная практика</p>
                    <p className="mt-1 text-xs">4 сек вдох, 4 сек выдох</p>
                  </div>
                  
                  <div className="rounded-lg bg-accent p-3">
                    <p className="font-medium text-accent-foreground">🚶 Прогулка на свежем воздухе</p>
                    <p className="mt-1 text-xs">15 минут в день</p>
                  </div>
                  
                  <div className="rounded-lg bg-accent p-3">
                    <p className="font-medium text-accent-foreground">📖 Чтение полезной книги</p>
                    <p className="mt-1 text-xs">Перед сном 20 минут</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-card">
              <blockquote className="space-y-2 border-l-4 border-primary pl-4">
                <p className="text-sm italic text-foreground">
                  "Богатство не в количестве денег, а в довольстве сердца."
                </p>
                <footer className="text-xs text-muted-foreground">— Народная мудрость</footer>
              </blockquote>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
