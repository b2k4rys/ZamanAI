import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Challenge } from "@/types/challenge";
import { useChallenges } from "@/hooks/useChallenges";
import { useCustomer } from "@/contexts/CustomerContext";
import { Card } from "@/components/ui/card";
import { seedChallenges } from "@/data/seedChallenges";
import { toast } from "@/hooks/use-toast";

export const Challenges = () => {
  const { activeCustomer } = useCustomer();
  const { challenges, updateChallenge, deleteChallenge, createChallenge, runAutoCheckins } = useChallenges(activeCustomer.txns);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Run auto check-ins on mount and when transactions change
  useEffect(() => {
    const results = runAutoCheckins();
    
    // Show notifications for each auto check-in
    results.forEach((result, index) => {
      setTimeout(() => {
        toast({
          title: result.saved > 0 ? "Чек-ин засчитан! 🌿" : "Обновление челленджа",
          description: result.message,
          duration: 5000,
        });
      }, index * 1000); // Stagger notifications
    });
  }, [activeCustomer.txns.length]); // Re-run when transactions change

  const handlePause = (id: string) => {
    updateChallenge(id, { status: 'paused' });
  };

  const handleViewDetails = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    // TODO: Open detail drawer
  };

  const handleLoadSeed = () => {
    seedChallenges.forEach(seed => createChallenge(seed));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Челленджи
          </h1>
          <p className="text-muted-foreground mt-2">
            Создавайте вызовы себе и экономьте деньги на важные цели
          </p>
        </div>
        <div className="flex gap-2">
          {challenges.length === 0 && (
            <Button variant="outline" onClick={handleLoadSeed}>
              Загрузить примеры
            </Button>
          )}
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Создать челлендж
          </Button>
        </div>
      </div>

      {challenges.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Пока нет челленджей
            </h3>
            <p className="text-muted-foreground">
              Создайте первый челлендж и начните экономить на важные цели.
              Попробуйте отказаться от кофе на неделю или сократить расходы на доставку!
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleLoadSeed} variant="outline">
                Посмотреть примеры
              </Button>
              <Button>Создать челлендж</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onViewDetails={handleViewDetails}
              onPause={handlePause}
              onDelete={deleteChallenge}
            />
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {challenges.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Активных челленджей</p>
              <p className="text-3xl font-bold text-primary">
                {challenges.filter(c => c.status === 'active').length}
              </p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Всего сэкономлено</p>
              <p className="text-3xl font-bold text-foreground">
                {challenges.reduce((sum, c) => sum + c.saved, 0).toLocaleString()} ₸
              </p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Завершено</p>
              <p className="text-3xl font-bold text-green-600">
                {challenges.filter(c => c.status === 'completed').length}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
