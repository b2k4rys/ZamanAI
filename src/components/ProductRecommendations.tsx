import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Wallet, Home, Car, ArrowRight, RefreshCw, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { customers } from "@/data/customers";
import { products } from "@/data/products";
import { recommend, generateMonthVariation } from "@/lib/recommendations";
import { Customer } from "@/types/customer";
import { Product, ProductIcon } from "@/types/product";
import { toast } from "@/hooks/use-toast";

const iconMap: Record<ProductIcon, typeof TrendingUp> = {
  growth: TrendingUp,
  shield: Shield,
  wallet: Wallet,
  home: Home,
  car: Car,
};

export const ProductRecommendations = () => {
  const [activeCustomer, setActiveCustomer] = useState<Customer>(customers[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const recommendations = recommend(activeCustomer, products);
  
  const totalExpenses = activeCustomer.expenses.reduce((sum, e) => sum + e.amount, 0);
  const freeCash = Math.max(activeCustomer.monthlyIncome - totalExpenses, 0);

  const handleGenerateMonth = () => {
    const varied = generateMonthVariation(activeCustomer);
    setActiveCustomer(varied);
    toast({
      title: "Месяц сгенерирован",
      description: "Расходы обновлены с учётом вариаций ±10%",
    });
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setActiveCustomer(customer);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Рекомендовано вам</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select value={activeCustomer.id} onValueChange={handleCustomerChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateMonth}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Сгенерировать месяц
        </Button>
      </div>

      <Card className="bg-primary/5 border-primary/20 p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Расходы за месяц: </span>
            <span className="font-semibold text-foreground">
              {totalExpenses.toLocaleString("ru-KZ")} ₸
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Свободный остаток: </span>
            <span className="font-semibold text-primary">
              {freeCash.toLocaleString("ru-KZ")} ₸
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {recommendations.map((rec) => {
          const Icon = iconMap[rec.product.icon];
          return (
            <Card
              key={rec.product.id}
              className="group overflow-hidden p-6 shadow-card transition-all hover:shadow-elevated cursor-pointer"
              onClick={() => setSelectedProduct(rec.product)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary group-hover:bg-primary-hover transition-colors">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{rec.product.name}</h3>
                      {rec.product.badge && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {rec.product.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.product.tagline}</p>
                    {rec.why.length > 0 && (
                      <p className="text-sm font-medium text-primary">
                        Почему вам: {rec.why.join("; ")}
                      </p>
                    )}
                    {rec.product.aprFrom && (
                      <p className="text-xs italic text-muted-foreground">
                        от {rec.product.aprFrom}% годовых
                      </p>
                    )}
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

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>{selectedProduct?.tagline}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground">{selectedProduct?.description}</p>
            {selectedProduct?.aprFrom && (
              <p className="text-sm text-muted-foreground">
                Ставка: от {selectedProduct.aprFrom}% годовых
              </p>
            )}
            <div className="flex gap-2">
              <Button className="flex-1">Оставить заявку</Button>
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
