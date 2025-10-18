import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Wallet, ArrowRight } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  rate: string;
  icon: typeof TrendingUp;
  tag: string;
}

const products: Product[] = [
  {
    id: "1",
    title: "Халяль-депозит",
    description: "Накопительный счет по принципам исламского банкинга",
    rate: "до 15% годовых",
    icon: TrendingUp,
    tag: "Рекомендовано",
  },
  {
    id: "2",
    title: "Иджара (Авто)",
    description: "Приобретение автомобиля без процентов",
    rate: "от 12% годовых",
    icon: Shield,
    tag: "Популярно",
  },
  {
    id: "3",
    title: "Инвестиции",
    description: "Халяль-инвестирование в проверенные проекты",
    rate: "от 18% годовых",
    icon: Wallet,
    tag: "Для целей",
  },
];

export const ProductRecommendations = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Рекомендовано вам</h2>
      
      <div className="grid gap-4">
        {products.map((product) => {
          const Icon = product.icon;
          return (
            <Card
              key={product.id}
              className="group overflow-hidden p-6 shadow-card transition-all hover:shadow-elevated"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary group-hover:bg-primary-hover transition-colors">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{product.title}</h3>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {product.tag}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                    <p className="text-sm font-semibold text-primary">{product.rate}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-2 hover:bg-accent"
                >
                  Подробнее
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
