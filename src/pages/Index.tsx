import { Navbar } from "@/components/Navbar";
import { ChatAssistant } from "@/components/ChatAssistant";
import { GoalCard } from "@/components/GoalCard";
import { ExpenseAnalytics } from "@/components/ExpenseAnalytics";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { SalaryInsight } from "@/components/SalaryInsight";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { goals } from "@/data/mockGoals";

const Index = () => {
  const [goalContributions, setGoalContributions] = useState<Record<string, number>>({});

  const handleContribute = (goalId: string, amount: number, date: string) => {
    setGoalContributions(prev => ({
      ...prev,
      [goalId]: (prev[goalId] || 0) + amount
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Chat */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden shadow-card">
              <ChatAssistant />
            </Card>

            <GoalCard contributions={goalContributions} />
            
            <ExpenseAnalytics />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <ProductRecommendations />

            <SalaryInsight onContribute={handleContribute} />

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
