import { Navbar } from "@/components/Navbar";
import { ChatAssistant } from "@/components/ChatAssistant";
import { Goals } from "@/pages/Goals";
import { Analytics } from "@/pages/Analytics";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { CustomerSelector } from "@/components/CustomerSelector";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
import { goals } from "@/data/mockGoals";
import { useCustomer } from "@/contexts/CustomerContext";
import { buildKPI, detectSubscriptions, getTopMerchants, getCategoryBreakdown, generateInsights } from "@/lib/analytics";

const Index = () => {
  const [goalContributions, setGoalContributions] = useState<Record<string, number>>({});
  const [activeMainTab, setActiveMainTab] = useState(() => {
    return localStorage.getItem("zaman.activeTab") || "assistant";
  });
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("expenses");
  const { activeCustomer } = useCustomer();

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem("zaman.activeTab", activeMainTab);
  }, [activeMainTab]);

  const handleContribute = (goalId: string, amount: number, date: string) => {
    setGoalContributions(prev => ({
      ...prev,
      [goalId]: (prev[goalId] || 0) + amount
    }));
  };

  const handleCreateGoal = (title: string, target: number, deadline?: string) => {
    // For now, just show a toast - would integrate with actual goal management
    console.log("Create goal:", { title, target, deadline });
  };

  const handleShowExpenseBreakdown = (category?: string, merchant?: string) => {
    // Switch to analytics tab, then to appropriate sub-tab
    setActiveMainTab("analytics");
    if (merchant) {
      setActiveAnalyticsTab("merchants");
    } else if (category) {
      setActiveAnalyticsTab("expenses");
    }
  };

  const handleShowGoals = () => {
    setActiveMainTab("goals");
  };

  const handleShowProductRecs = () => {
    // Scroll to product recommendations
    const element = document.getElementById("product-recommendations");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
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

            {/* Main Navigation Tabs */}
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="assistant" className="gap-2 text-base">
                  💬 Ассистент
                </TabsTrigger>
                <TabsTrigger value="goals" className="gap-2 text-base">
                  🎯 Мои цели
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 text-base">
                  📊 Аналитика
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assistant" className="mt-6 space-y-8">
                <div className="relative">
                  <ChatAssistant 
                    goals={goals} 
                    onContribute={handleContribute}
                    onCreateGoal={handleCreateGoal}
                    onShowExpenseBreakdown={handleShowExpenseBreakdown}
                    onShowProductRecs={handleShowProductRecs}
                    onShowGoals={handleShowGoals}
                  />
                </div>
              </TabsContent>

              <TabsContent value="goals" className="mt-6">
                <Goals contributions={goalContributions} />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <Analytics 
                  kpi={analytics.kpi}
                  subscriptions={analytics.subscriptions}
                  topMerchants={analytics.topMerchants}
                  categoryBreakdown={analytics.categoryBreakdown}
                  insights={analytics.insights}
                  transactions={activeCustomer.txns}
                  activeAnalyticsTab={activeAnalyticsTab}
                  onAnalyticsTabChange={setActiveAnalyticsTab}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6" id="product-recommendations">
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
