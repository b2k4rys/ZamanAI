import { Card } from "@/components/ui/card";
import { ShoppingBag, Car as CarIcon, Heart, Home, TrendingDown } from "lucide-react";

interface ExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
  icon: typeof ShoppingBag;
  color: string;
}

const expenses: ExpenseCategory[] = [
  { name: "Еда и продукты", amount: 85000, percentage: 35, icon: ShoppingBag, color: "bg-primary" },
  { name: "Транспорт", amount: 45000, percentage: 18, icon: CarIcon, color: "bg-secondary" },
  { name: "Жилье", amount: 60000, percentage: 25, icon: Home, color: "bg-accent" },
  { name: "Благотворительность", amount: 30000, percentage: 12, icon: Heart, color: "bg-muted" },
];

export const ExpenseAnalytics = () => {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Card className="p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Расходы за месяц</h2>
          <p className="text-sm text-muted-foreground">
            Всего: {new Intl.NumberFormat("ru-KZ").format(total)} ₸
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2">
          <TrendingDown className="h-4 w-4 text-accent-foreground" />
          <span className="text-sm font-medium text-accent-foreground">-12% от прошлого месяца</span>
        </div>
      </div>

      <div className="space-y-4">
        {expenses.map((expense) => {
          const Icon = expense.icon;
          return (
            <div key={expense.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${expense.color}`}>
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{expense.name}</p>
                    <p className="text-sm text-muted-foreground">{expense.percentage}% расходов</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {new Intl.NumberFormat("ru-KZ").format(expense.amount)} ₸
                  </p>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${expense.color} transition-all duration-500`}
                  style={{ width: `${expense.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-accent p-4">
        <p className="text-sm text-accent-foreground">
          💡 <span className="font-semibold">Совет:</span> Попробуйте сократить расходы на еду на 10% — 
          это поможет накопить дополнительно 8,500 ₸ в месяц на ваши цели.
        </p>
      </div>
    </Card>
  );
};
