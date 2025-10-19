import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Transaction, Category } from "@/types/transaction";
import { Download, Search, ArrowUpDown, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

interface CategoryDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  transactions: Transaction[];
  icon?: React.ComponentType<any>;
}

type SortField = 'date' | 'amount';
type SortOrder = 'asc' | 'desc';
type Period = 'week' | 'month' | 'quarter' | 'year';

export const CategoryDetailsDrawer = ({
  open,
  onClose,
  category,
  transactions,
  icon: Icon,
}: CategoryDetailsDrawerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [onlyRecurring, setOnlyRecurring] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    if (!category) return [];

    const now = new Date();
    let startDate = new Date(now);
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    let filtered = transactions.filter(t => {
      const txDate = new Date(t.date);
      const matchesCategory = t.category === category;
      const matchesDate = txDate >= startDate && txDate <= now;
      const matchesSearch = !searchQuery || 
        (t.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.note?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesMin = !minAmount || Math.abs(t.amount) >= parseFloat(minAmount);
      const matchesMax = !maxAmount || Math.abs(t.amount) <= parseFloat(maxAmount);

      return matchesCategory && matchesDate && matchesSearch && matchesMin && matchesMax;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const amountA = Math.abs(a.amount);
        const amountB = Math.abs(b.amount);
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
      }
    });

    return filtered;
  }, [category, transactions, period, searchQuery, minAmount, maxAmount, onlyRecurring, sortField, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const count = filteredTransactions.length;
    const avg = count > 0 ? Math.round(total / count) : 0;

    // Top merchant
    const merchantTotals: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const merchant = t.merchant || 'Unknown';
      merchantTotals[merchant] = (merchantTotals[merchant] || 0) + Math.abs(t.amount);
    });

    const topMerchantEntry = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])[0];
    
    const topMerchant = topMerchantEntry ? {
      name: topMerchantEntry[0],
      amount: topMerchantEntry[1],
      percentage: (topMerchantEntry[1] / total) * 100
    } : null;

    return { total, count, avg, topMerchant };
  }, [filteredTransactions]);

  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "Нет данных",
        description: "Нет транзакций для экспорта",
        variant: "destructive",
      });
      return;
    }

    const headers = "Дата,Мерчант,Категория,Сумма,Примечание\n";
    const rows = filteredTransactions.map(t => 
      `${t.date},${t.merchant || ''},${t.category || ''},${Math.abs(t.amount)},"${(t.note || '').replace(/"/g, '""')}"`
    ).join('\n');
    
    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${category}_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Экспорт завершен",
      description: `Экспортировано ${filteredTransactions.length} транзакций`,
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  };

  const formatAmount = (amount: number) => {
    return Math.abs(amount).toLocaleString('ru-KZ');
  };

  if (!category) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-2xl">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            {category}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Всего потрачено</p>
                <p className="text-2xl font-bold text-primary">
                  {stats.total.toLocaleString('ru-KZ')} ₸
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Транзакций</p>
                <p className="text-2xl font-bold text-foreground">{stats.count}</p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Средний чек</p>
                <p className="text-xl font-bold text-foreground">
                  {stats.avg.toLocaleString('ru-KZ')} ₸
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Топ мерчант</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {stats.topMerchant ? stats.topMerchant.name : '—'}
                </p>
                {stats.topMerchant && (
                  <p className="text-xs text-muted-foreground">
                    {stats.topMerchant.percentage.toFixed(0)}% категории
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4 space-y-4">
            <h4 className="font-semibold text-foreground">Фильтры</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Период</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Неделя</SelectItem>
                    <SelectItem value="month">Месяц</SelectItem>
                    <SelectItem value="quarter">Квартал</SelectItem>
                    <SelectItem value="year">Год</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Поиск</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Мерчант или примечание"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Мин. сумма</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Макс. сумма</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={onlyRecurring}
                  onCheckedChange={(checked) => setOnlyRecurring(checked as boolean)}
                />
                <Label htmlFor="recurring" className="cursor-pointer">
                  Только подписки
                </Label>
              </div>

              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Экспорт CSV
              </Button>
            </div>
          </Card>

          {/* Transactions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">
                Транзакции ({filteredTransactions.length})
              </h4>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('date')}
                  className="gap-1"
                >
                  Дата
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('amount')}
                  className="gap-1"
                >
                  Сумма
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-lg border">
              {filteredTransactions.length === 0 ? (
                <div className="flex items-center justify-center h-full p-8">
                  <p className="text-muted-foreground text-center">
                    В этом периоде нет расходов по категории
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredTransactions.map((txn) => (
                    <Card key={txn.id} className="p-3 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground truncate">
                              {txn.merchant || 'Unknown'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(txn.date)}</span>
                            {txn.note && (
                              <>
                                <span>•</span>
                                <span className="truncate">{txn.note}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary font-mono">
                            {formatAmount(txn.amount)} ₸
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Assistant Tip */}
          {stats.topMerchant && stats.topMerchant.percentage > 30 && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{stats.topMerchant.name}</span> составляет{' '}
                    {stats.topMerchant.percentage.toFixed(0)}% этой категории.
                    {stats.topMerchant.percentage > 50 && ' Рассмотрите установку лимита?'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
