import type { ReflectionSlideData } from '@/types/reflection';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Heart, Rocket, TrendingUp } from 'lucide-react';

interface ReflectionSlideProps {
  slide: ReflectionSlideData;
  onAction?: (action: string, data?: any) => void;
}

export const ReflectionSlide = ({ slide, onAction }: ReflectionSlideProps) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ').format(Math.abs(amount));
  };

  return (
    <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 p-8 flex flex-col justify-center items-center text-center">
      {slide.emoji && (
        <div className="text-6xl mb-6 animate-scale-in">{slide.emoji}</div>
      )}
      
      <h2 className="text-3xl font-bold text-foreground mb-4">{slide.title}</h2>
      
      {slide.subtitle && (
        <p className="text-lg text-muted-foreground mb-6">{slide.subtitle}</p>
      )}

      <div className="w-full max-w-md">
        {slide.type === 'summary' && slide.data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">{slide.data.topUpCount}</div>
                <div className="text-sm text-muted-foreground">💸 Пополнений</div>
              </div>
              <div className="bg-card/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">{slide.data.foodCount}</div>
                <div className="text-sm text-muted-foreground">🍔 Трат на еду</div>
              </div>
              <div className="bg-card/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">{formatAmount(slide.data.savingsSum)}</div>
                <div className="text-sm text-muted-foreground">🏦 Накоплено ₸</div>
              </div>
              <div className="bg-card/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">{slide.data.donationsCount}</div>
                <div className="text-sm text-muted-foreground">🌿 Пожертвований</div>
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 mt-4">
              <div className="text-3xl font-bold text-foreground">{formatAmount(slide.data.totalSpend)} ₸</div>
              <div className="text-sm text-muted-foreground">Всего потрачено</div>
            </div>
          </div>
        )}

        {slide.type === 'categories' && slide.data && (
          <div className="space-y-4">
            {slide.data.categories.map((cat: any, idx: number) => (
              <div key={idx} className="bg-card/50 rounded-lg p-4 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-foreground">{cat.category}</span>
                  <span className="text-lg font-bold text-primary">{formatAmount(cat.amount)} ₸</span>
                </div>
                <Progress value={cat.percentage} className="h-3" />
                <div className="text-xs text-muted-foreground mt-1">
                  {cat.percentage.toFixed(1)}% от всех трат
                </div>
              </div>
            ))}
          </div>
        )}

        {slide.type === 'goals' && slide.data && (
          <div className="space-y-6">
            <div className="bg-card/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground">{slide.data.goal.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatAmount(slide.data.goal.current)} / {formatAmount(slide.data.goal.target)} ₸
                  </div>
                </div>
              </div>
              <Progress value={slide.data.progress} className="h-4 mb-2" />
              <div className="text-center">
                <span className="text-2xl font-bold text-primary">{slide.data.progress.toFixed(1)}%</span>
                <span className="text-sm text-muted-foreground ml-2">выполнено</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Ты стал на {slide.data.progress.toFixed(1)}% ближе к мечте «{slide.data.goal.name}»
            </p>
          </div>
        )}

        {slide.type === 'generosity' && slide.data && (
          <div className="space-y-4">
            {slide.data.donations > 0 && (
              <div className="bg-card/50 rounded-lg p-6">
                <Heart className="h-10 w-10 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground">{slide.data.donations}</div>
                <div className="text-sm text-muted-foreground mt-2">пожертвований сделано</div>
                <p className="text-xs text-muted-foreground mt-4">
                  Щедрый месяц 🌿 — пусть добро возвращается
                </p>
              </div>
            )}
            {slide.data.savings > 0 && (
              <div className="bg-card/50 rounded-lg p-6">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground">{formatAmount(slide.data.savings)} ₸</div>
                <div className="text-sm text-muted-foreground mt-2">накоплено за месяц</div>
                <p className="text-xs text-muted-foreground mt-4">
                  Курс на будущие цели 🌅 — так держать!
                </p>
              </div>
            )}
          </div>
        )}

        {slide.type === 'cta' && (
          <div className="space-y-4">
            <Rocket className="h-16 w-16 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">
              Продолжай путь к финансовой свободе
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => onAction?.('create_goal')} 
                className="w-full"
                size="lg"
              >
                🎯 Создать новую цель
              </Button>
              <Button 
                onClick={() => onAction?.('create_challenge')} 
                variant="outline"
                className="w-full"
                size="lg"
              >
                ⚡ Запустить челлендж
              </Button>
              <Button 
                onClick={() => onAction?.('view_analytics')} 
                variant="outline"
                className="w-full"
                size="lg"
              >
                📊 Посмотреть аналитику
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
