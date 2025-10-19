import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Zap, Library } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ChallengeBankDialog } from "@/components/ChallengeBankDialog";
import { Challenge } from "@/types/challenge";
import { useChallenges } from "@/hooks/useChallenges";
import { useCustomer } from "@/contexts/CustomerContext";
import { Card } from "@/components/ui/card";
import { getChallengeBank } from "@/data/challengeBank";
import { toast } from "@/hooks/use-toast";

export const Challenges = () => {
  const { activeCustomer } = useCustomer();
  const { challenges, updateChallenge, deleteChallenge, createChallenge, runAutoCheckins } = useChallenges(activeCustomer.txns);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [templates] = useState(() => getChallengeBank());

  // Migrate existing challenges to add icons
  useEffect(() => {
    const bank = getChallengeBank();
    const byTplId = Object.fromEntries(bank.map((t) => [t.id, t]));
    
    const inferIcon = (title?: string, place?: string): string | undefined => {
      const text = `${title || ''} ${place || ''}`.toLowerCase();
      const icons: Record<string, string> = {
        "такси": "🚕",
        "еда": "🍔",
        "доставка": "🍱",
        "кофе": "☕",
        "подписк": "📺",
        "развлеч": "🎉",
        "прогулк": "🚶",
        "продукт": "🛒",
        "шопинг": "🛍️",
        "транспорт": "🚌",
        "вне дома": "🍽️",
        "рестор": "🍽️",
      };
      
      for (const [key, icon] of Object.entries(icons)) {
        if (text.includes(key)) return icon;
      }
      return undefined;
    };

    let migrated = false;
    const updated = challenges.map((c) => {
      if (c.icon) return c;
      const tpl = c.templateId ? byTplId[c.templateId] : null;
      const icon = tpl?.icon || inferIcon(c.title, c.scope.kind === 'category' ? c.scope.value : undefined);
      if (icon) {
        migrated = true;
        return { ...c, icon };
      }
      return c;
    });

    if (migrated) {
      localStorage.setItem('zaman.challenges.v2', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('challenges:updated'));
      toast({
        title: "Иконки челленджей обновлены ✨",
        description: "Все карточки теперь с иконками",
      });
    }
  }, []); // Run once on mount

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

  const handleAddFromBank = (templateIds: string[]) => {
    const selectedTemplates = templates.filter(t => templateIds.includes(t.id));
    
    // Check for duplicates and warn
    const warnings: string[] = [];
    selectedTemplates.forEach(template => {
      const existing = challenges.find(
        c => c.templateId === template.id && c.status === 'active'
      );
      if (existing) {
        warnings.push(template.title);
      }
    });

    if (warnings.length > 0 && warnings.length === selectedTemplates.length) {
      toast({
        title: "⚠️ Внимание",
        description: `У вас уже есть активные челленджи: ${warnings.join(', ')}`,
        duration: 5000,
      });
    }

    // Helper to infer icon if template doesn't have one
    const inferIcon = (title?: string, place?: string): string | undefined => {
      const text = `${title || ''} ${place || ''}`.toLowerCase();
      const icons: Record<string, string> = {
        "такси": "🚕",
        "еда": "🍔",
        "доставка": "🍱",
        "кофе": "☕",
        "подписк": "📺",
        "развлеч": "🎉",
        "прогулк": "🚶",
        "продукт": "🛒",
        "шопинг": "🛍️",
        "транспорт": "🚌",
        "вне дома": "🍽️",
        "рестор": "🍽️",
      };
      
      for (const [key, icon] of Object.entries(icons)) {
        if (text.includes(key)) return icon;
      }
      return undefined;
    };

    // Create challenges from templates
    selectedTemplates.forEach(template => {
      const startDate = new Date().toISOString().split('T')[0];
      const daysLeft = template.period === 'month' ? 30 : 7;
      const endDate = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      createChallenge({
        templateId: template.id,
        title: template.title,
        scope: (template.scope as any) || { kind: 'category', value: 'Другое' },
        durationDays: (template.period === 'month' ? 30 : 7) as 7 | 14 | 30,
        target: { mode: 'amount', value: template.targetAmount },
        startDate,
        endDate,
        baseline: template.targetAmount * 1.5,
        status: 'active',
        hacks: [],
        icon: template.icon || inferIcon(template.title, template.place),
      });
    });

    toast({
      title: `Добавлено ${selectedTemplates.length} челленджей из банка 🙌`,
      description: "Челленджи успешно созданы",
    });
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" style={{ lineHeight: '1.2' }}>
            <Zap className="h-8 w-8 text-primary" />
            Челленджи
          </h1>
          <p className="text-muted-foreground mt-2" style={{ lineHeight: '1.3' }}>
            Создавайте вызовы себе и экономьте деньги на важные цели
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setBankDialogOpen(true)}
            className="gap-2"
          >
            <Library className="h-4 w-4" />
            Из банка шаблонов
          </Button>
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
              <Button onClick={() => setBankDialogOpen(true)} variant="outline">
                <Library className="h-4 w-4 mr-2" />
                Из банка шаблонов
              </Button>
              <Button>Создать челлендж</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 sm:gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', justifyContent: 'center' }}>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-6 flex items-center justify-center">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground" style={{ lineHeight: '1.3' }}>Активных челленджей</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary" style={{ lineHeight: '1.2' }}>
                {challenges.filter(c => c.status === 'active').length}
              </p>
            </div>
          </Card>
          <Card className="p-6 flex items-center justify-center">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground" style={{ lineHeight: '1.3' }}>Всего сэкономлено</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground" style={{ lineHeight: '1.2' }}>
                {new Intl.NumberFormat('ru-KZ').format(challenges.reduce((sum, c) => sum + c.saved, 0))} ₸
              </p>
            </div>
          </Card>
          <Card className="p-6 flex items-center justify-center">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground" style={{ lineHeight: '1.3' }}>Завершено</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600" style={{ lineHeight: '1.2' }}>
                {challenges.filter(c => c.status === 'completed').length}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Challenge Bank Dialog */}
      <ChallengeBankDialog
        open={bankDialogOpen}
        onOpenChange={setBankDialogOpen}
        templates={templates}
        onAddSelected={handleAddFromBank}
      />
    </div>
  );
};
