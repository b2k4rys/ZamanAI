import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useCustomer } from "@/contexts/CustomerContext";
import {
  getUserProfile,
  saveUserProfile,
  getCohort,
  getUserMonthlySpend,
  compareWithCohort,
  type UserProfile,
  type ComparisonResult,
} from "@/lib/benchmarkEngine";
import { TrendingDown, TrendingUp, Minus, Target } from "lucide-react";

export function BenchmarkComparison() {
  const { activeCustomer } = useCustomer();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResult[]>([]);
  const [selectedAgeBand, setSelectedAgeBand] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    const loadedProfile = getUserProfile();
    if (loadedProfile) {
      setProfile(loadedProfile);
      loadComparison(loadedProfile);
    } else {
      setShowProfileDialog(true);
    }
  }, [activeCustomer.id]);

  const loadComparison = (userProfile: UserProfile) => {
    const cohort = getCohort(userProfile);
    if (!cohort) return;

    const userSpend = getUserMonthlySpend(activeCustomer.txns);
    const results = compareWithCohort(userSpend, cohort);
    setComparison(results);
  };

  const handleSaveProfile = () => {
    if (!selectedAgeBand) return;

    const newProfile: UserProfile = {
      ageBand: selectedAgeBand,
      city: selectedCity || undefined,
    };

    saveUserProfile(newProfile);
    setProfile(newProfile);
    setShowProfileDialog(false);
    loadComparison(newProfile);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Еда': '🍽️',
      'Транспорт': '🚗',
      'Подписки': '📱',
      'Развлечения': '🎭',
      'Покупки': '🛍️',
    };
    return icons[category] || '📊';
  };

  const getVerdictBadge = (result: ComparisonResult) => {
    if (result.verdict === 'below') {
      return (
        <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
          <TrendingDown className="h-3 w-3" />
          Ниже среднего {result.deltaPct}%
        </Badge>
      );
    }
    if (result.verdict === 'above') {
      return (
        <Badge variant="outline" className="gap-1 bg-orange-500/10 text-orange-700 border-orange-500/30">
          <TrendingUp className="h-3 w-3" />
          Выше среднего +{result.deltaPct}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-700 border-blue-500/30">
        <Minus className="h-3 w-3" />
        Близко к среднему
      </Badge>
    );
  };

  const getProgressPercent = (result: ComparisonResult) => {
    return Math.min((result.userSpend / result.p75) * 100, 100);
  };

  if (!profile) {
    return null;
  }

  const cohort = getCohort(profile);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              📊 Сравнение с похожими пользователями
            </h2>
            <p className="text-muted-foreground">
              Группа: <span className="font-semibold text-foreground">{profile.ageBand}</span> (анонимно)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProfileDialog(true)}
          >
            Изменить профиль
          </Button>
        </div>
      </Card>

      {/* Empty state */}
      {comparison.length === 0 && (
        <Card className="p-12 text-center">
          <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Данных за период нет</h3>
          <p className="text-muted-foreground">
            Добавьте транзакции за текущий месяц, чтобы увидеть сравнение
          </p>
        </Card>
      )}

      {/* Comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparison.map((result) => (
          <Card key={result.category} className="p-5 hover:shadow-lg transition-all">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">{getCategoryIcon(result.category)}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  {result.category}
                </h3>
                {getVerdictBadge(result)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Ваши траты:</span>
                <span className="text-lg font-bold text-foreground">
                  {result.userSpend.toLocaleString('ru-KZ')} ₸
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Средний:</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {result.p50.toLocaleString('ru-KZ')} ₸
                </span>
              </div>

              <Progress value={getProgressPercent(result)} className="h-2" />

              {result.verdict === 'above' && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">
                    💡 Совет: Попробуйте создать челлендж для этой категории
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Создать челлендж
                  </Button>
                </div>
              )}

              {result.verdict === 'below' && result.userSpend > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-emerald-700">
                    ✨ Отличная работа! Продолжайте в том же духе
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Profile setup dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Помоги подобрать группу сравнения</DialogTitle>
            <DialogDescription>
              Мы используем эти данные только для показа анонимной статистики. 
              Информация хранится локально на вашем устройстве.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Возрастная группа</label>
              <Select value={selectedAgeBand} onValueChange={setSelectedAgeBand}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите возраст" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18–24">18–24 года</SelectItem>
                  <SelectItem value="25–34">25–34 года</SelectItem>
                  <SelectItem value="35–44">35–44 года</SelectItem>
                  <SelectItem value="45+">45+ лет</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Город (опционально)</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Almaty">Алматы</SelectItem>
                  <SelectItem value="Astana">Астана</SelectItem>
                  <SelectItem value="Shymkent">Шымкент</SelectItem>
                  <SelectItem value="Other">Другой</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveProfile}
              disabled={!selectedAgeBand}
              className="flex-1"
            >
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
