import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShoppingCart, Car, Home, Tv, Heart, BookOpen, Activity, Package } from "lucide-react";
import { CategoryBreakdown } from "@/types/transaction";

const categoryIcons: Record<string, any> = {
  'Еда': ShoppingCart,
  'Транспорт': Car,
  'Дом': Home,
  'Подписки': Tv,
  'Развлечения': Activity,
  'Образование': BookOpen,
  'Благотворительность': Heart,
  'Другое': Package,
};

interface ExpenseAnalyticsProps {
  categories: CategoryBreakdown[];
  totalSpend: number;
}

export const ExpenseAnalytics = ({ categories, totalSpend }: ExpenseAnalyticsProps) => {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Расходы по категориям</h3>
        <p className="text-2xl font-bold text-primary">
          {totalSpend.toLocaleString('ru-KZ')} ₸
        </p>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = categoryIcons[category.category] || ShoppingCart;
          const hasTrend = category.trend !== undefined;
          const trendUp = category.trend && category.trend > 0;
          
          return (
            <div key={category.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{category.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.percentage.toFixed(1)}% от бюджета
                      {hasTrend && (
                        <span className={trendUp ? 'text-destructive ml-2' : 'text-primary ml-2'}>
                          {trendUp ? '↑' : '↓'} {Math.abs(category.trend!).toFixed(0)}%
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-foreground">
                  {category.amount.toLocaleString('ru-KZ')} ₸
                </p>
              </div>
              <Progress value={category.percentage} className="h-2" />
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground italic">
          💡 Совет: Сократите импульсные траты на 10% — это ~{(totalSpend * 0.1).toLocaleString('ru-KZ')} ₸ в месяц на цели
        </p>
      </div>
    </Card>
  );
};
