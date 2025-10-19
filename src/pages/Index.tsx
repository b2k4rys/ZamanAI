import { Navbar } from "@/components/Navbar";
import { ChatAssistant } from "@/components/ChatAssistant";
import { Goals } from "@/pages/Goals";
import { Analytics } from "@/pages/Analytics";
import { Challenges } from "@/pages/Challenges";
import { CustomerSelector } from "@/components/CustomerSelector";
import { ReflectionModal } from "@/components/ReflectionModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
import { getGoals } from "@/lib/goalsRepository";
import { useCustomer } from "@/contexts/CustomerContext";
import { buildKPI, detectSubscriptions, getTopMerchants, getCategoryBreakdown, generateInsights } from "@/lib/analytics";

const Index = () => {
  const [goalContributions, setGoalContributions] = useState<Record<string, number>>({});
  const [activeMainTab, setActiveMainTab] = useState(() => {
    return localStorage.getItem("zaman.activeTab") || "assistant";
  });
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("expenses");
  const [reflectionOpen, setReflectionOpen] = useState(false);
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

  const handleShowChallenges = () => {
    setActiveMainTab("challenges");
  };

  const handleShowProductRecs = () => {
    // Products are now shown in chat
    console.log("Products shown in chat");
  };

  const handleInsightAction = (action: string, insight: any) => {
    switch (action) {
      case 'Создать челлендж':
        setActiveMainTab('challenges');
        break;
      case 'Перевести в цель':
        setActiveMainTab('goals');
        break;
      case 'Посмотреть продукты':
        handleShowProductRecs();
        break;
      default:
        console.log('Unknown insight action:', action, insight);
    }
  };

  // Calculate analytics from active customer transactions (memoized for performance)
  const analytics = useMemo(() => {
    const kpi = buildKPI(activeCustomer.txns, activeCustomer.monthlyIncome);
    const subscriptions = detectSubscriptions(activeCustomer.txns);
    const topMerchants = getTopMerchants(kpi, 5);
    const categoryBreakdown = getCategoryBreakdown(kpi);
    
    // For prevKpi, we could store previous month's data, but for demo just use undefined
    // In production, you'd fetch previous period's KPI from storage/API
    const insights = generateInsights(kpi, subscriptions, undefined, activeCustomer.txns);
    
    return { kpi, subscriptions, topMerchants, categoryBreakdown, insights };
  }, [activeCustomer]);

  // Get goals from repository
  const customerGoals = useMemo(() => getGoals(), [activeCustomer]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Customer Selector */}
          <CustomerSelector />

          {/* Main Navigation Tabs */}
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full mt-8">
            <TabsList className="grid w-full grid-cols-4 h-12">
              <TabsTrigger value="assistant" className="gap-2 text-base">
                💬 Ассистент
              </TabsTrigger>
              <TabsTrigger value="goals" className="gap-2 text-base">
                🎯 Мои цели
              </TabsTrigger>
              <TabsTrigger value="challenges" className="gap-2 text-base">
                ⚡ Челленджи
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 text-base">
                📊 Аналитика
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assistant" className="mt-6 space-y-8">
              <div className="relative">
                <ChatAssistant 
                  goals={customerGoals}
                  challenges={[]} // TODO: Pass actual challenges from context
                  onContribute={handleContribute}
                  onCreateGoal={handleCreateGoal}
                  onShowExpenseBreakdown={handleShowExpenseBreakdown}
                  onShowProductRecs={handleShowProductRecs}
                  onShowGoals={handleShowGoals}
                  onShowChallenges={handleShowChallenges}
                />
              </div>
            </TabsContent>

            <TabsContent value="goals" className="mt-6">
              <Goals contributions={goalContributions} />
            </TabsContent>

            <TabsContent value="challenges" className="mt-6">
              <Challenges />
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
                onInsightAction={handleInsightAction}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Reflection Modal */}
      <ReflectionModal
        open={reflectionOpen}
        onOpenChange={setReflectionOpen}
        onAction={handleInsightAction}
      />
    </div>
  );
};

export default Index;
