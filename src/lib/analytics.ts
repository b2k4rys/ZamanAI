import { Transaction, KPI, Subscription, Insight, MerchantBreakdown, CategoryBreakdown, Category } from "@/types/transaction";

export function buildKPI(txns: Transaction[], income: number): KPI {
  const expenses = txns.filter(t => t.amount < 0);
  const totalSpend = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
  
  const byCategory: Record<Category, number> = {
    'Еда': 0,
    'Транспорт': 0,
    'Дом': 0,
    'Подписки': 0,
    'Развлечения': 0,
    'Образование': 0,
    'Здоровье': 0,
    'Благотворительность': 0,
    'Другое': 0,
  };
  
  const byMerchant: Record<string, number> = {};
  
  expenses.forEach(t => {
    const cat = t.category || 'Другое';
    const merchant = t.merchant || 'Unknown';
    byCategory[cat] = (byCategory[cat] || 0) + Math.abs(t.amount);
    byMerchant[merchant] = (byMerchant[merchant] || 0) + Math.abs(t.amount);
  });
  
  const freeCash = Math.max(income - totalSpend, 0);
  const avgDailySpend = totalSpend / 30;
  
  return { totalSpend, byCategory, byMerchant, freeCash, avgDailySpend };
}

export function detectSubscriptions(txns: Transaction[]): Subscription[] {
  const merchantGroups: Record<string, Transaction[]> = {};
  
  // Group by merchant
  txns.forEach(t => {
    if (t.amount >= 0) return; // only expenses
    const merchant = t.merchant || 'Unknown';
    if (!merchantGroups[merchant]) {
      merchantGroups[merchant] = [];
    }
    merchantGroups[merchant].push(t);
  });
  
  const subscriptions: Subscription[] = [];
  
  Object.entries(merchantGroups).forEach(([merchant, transactions]) => {
    if (transactions.length < 2) return;
    
    // Sort by date
    const sorted = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate intervals between transactions
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.round(
        (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      intervals.push(days);
    }
    
    // Check if intervals are consistent (subscription pattern)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const isRegular = intervals.every(i => Math.abs(i - avgInterval) <= 5);
    
    if (isRegular && avgInterval >= 25 && avgInterval <= 35) {
      const avgAmount = Math.abs(
        sorted.reduce((sum, t) => sum + t.amount, 0) / sorted.length
      );
      
      const lastDate = new Date(sorted[sorted.length - 1].date);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));
      
      subscriptions.push({
        merchant,
        avgAmount,
        nextDate: nextDate.toISOString().split('T')[0],
        active: true,
        frequency: Math.round(avgInterval),
      });
    }
  });
  
  return subscriptions.sort((a, b) => b.avgAmount - a.avgAmount);
}

export function getTopMerchants(kpi: KPI, limit = 5): MerchantBreakdown[] {
  const total = kpi.totalSpend;
  const merchants = Object.entries(kpi.byMerchant)
    .map(([merchant, amount]) => ({
      merchant,
      amount,
      percentage: (amount / total) * 100,
      count: 0, // Would need txns to calculate
      avgTransaction: 0,
      trend: Math.random() > 0.5 ? Math.random() * 20 - 10 : undefined,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
  
  return merchants;
}

export function getCategoryBreakdown(kpi: KPI): CategoryBreakdown[] {
  const total = kpi.totalSpend;
  return Object.entries(kpi.byCategory)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      category: category as Category,
      amount,
      percentage: (amount / total) * 100,
      trend: Math.random() > 0.5 ? Math.random() * 20 - 10 : undefined,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function generateInsights(
  kpi: KPI,
  subscriptions: Subscription[],
  prevKpi?: KPI,
  transactions?: Transaction[]
): Insight[] {
  const insights: Insight[] = [];
  let id = 0;
  
  const total = kpi.totalSpend;
  const cats = kpi.byCategory;
  
  // Alert: Overall spending increase >15%
  if (prevKpi && prevKpi.totalSpend > 0) {
    const increase = ((total - prevKpi.totalSpend) / prevKpi.totalSpend) * 100;
    if (increase > 15) {
      insights.push({
        id: `insight-${id++}`,
        type: 'alert',
        text: `Общие расходы выросли на ${increase.toFixed(0)}% с прошлого месяца. Проверьте категории "Еда" и "Развлечения"`,
        delta: increase,
        actionable: true,
      });
    }
  }
  
  // Check each category for overspend/saving
  if (prevKpi) {
    Object.entries(cats).forEach(([category, amount]) => {
      const prevAmount = prevKpi.byCategory[category as Category] || 0;
      if (prevAmount > 0) {
        const delta = ((amount - prevAmount) / prevAmount) * 100;
        
        // Overspend: category increased >10%
        if (delta > 10) {
          insights.push({
            id: `insight-${id++}`,
            type: 'overspend',
            text: `Расходы на ${category} выросли на ${delta.toFixed(0)}%. Возможно, стоит ограничить лимит или попробовать челлендж?`,
            category: category as Category,
            delta: delta,
            suggestedAction: 'Создать челлендж',
            actionable: true,
          });
        }
        
        // Saving: category decreased >5%
        if (delta < -5) {
          const saved = prevAmount - amount;
          insights.push({
            id: `insight-${id++}`,
            type: 'saving',
            text: `Ты сократил траты на ${category} на ${Math.abs(delta).toFixed(0)}% — молодец! Эти ${saved.toLocaleString()} ₸ можно перевести в копилку`,
            category: category as Category,
            delta: delta,
            suggestedAction: 'Перевести в цель',
            actionable: true,
          });
        }
      }
    });
  }
  
  // Habit: Frequent transactions at same merchant
  if (transactions && transactions.length > 0) {
    const merchantCounts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.merchant && t.amount < 0) {
        merchantCounts[t.merchant] = (merchantCounts[t.merchant] || 0) + 1;
      }
    });
    
    Object.entries(merchantCounts)
      .filter(([_, count]) => count >= 10)
      .slice(0, 2) // Top 2 habits
      .forEach(([merchant, count]) => {
        const merchantSpend = transactions
          .filter(t => t.merchant === merchant)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const potential = Math.round(merchantSpend * 0.4);
        
        insights.push({
          id: `insight-${id++}`,
          type: 'habit',
          text: `Ты купил в ${merchant} ${count} раз в этом месяце. Если сократить до ${Math.round(count * 0.6)}, сэкономишь около ${potential.toLocaleString()} ₸`,
          merchant: merchant,
          suggestedAction: 'Создать челлендж',
          actionable: true,
        });
      });
  }
  
  // Investment: High free cash
  if (kpi.freeCash > 50000) {
    insights.push({
      id: `insight-${id++}`,
      type: 'investment',
      text: `На твоём счёте стабильно больше ${kpi.freeCash.toLocaleString()} ₸. Можно разместить часть на халяль-депозит под 15% годовых`,
      suggestedAction: 'Посмотреть продукты',
      actionable: true,
    });
  }
  
  // High food spending
  if (cats['Еда'] > total * 0.35) {
    insights.push({
      id: `insight-${id++}`,
      type: 'warning',
      text: `Расходы на еду составляют ${((cats['Еда'] / total) * 100).toFixed(0)}% бюджета. Попробуйте готовить дома чаще — экономия до ${Math.round(cats['Еда'] * 0.3).toLocaleString()} ₸/мес`,
      category: 'Еда',
      actionable: true,
    });
  }
  
  // Transport optimization
  if (cats['Транспорт'] > total * 0.2) {
    insights.push({
      id: `insight-${id++}`,
      type: 'tip',
      text: `Высокие траты на транспорт (${cats['Транспорт'].toLocaleString()} ₸). Рассмотрите Иджару на авто — может быть выгоднее`,
      category: 'Транспорт',
      actionable: true,
    });
  }
  
  // Subscription audit
  const subTotal = subscriptions.reduce((s, sub) => s + sub.avgAmount, 0);
  if (subTotal > total * 0.1) {
    insights.push({
      id: `insight-${id++}`,
      type: 'warning',
      text: `Подписки: ${subTotal.toLocaleString()} ₸/мес (${subscriptions.length} шт). Проверьте неиспользуемые сервисы`,
      category: 'Подписки',
      actionable: true,
    });
  }
  
  // Good savings habit
  if (kpi.freeCash > kpi.totalSpend * 0.2) {
    insights.push({
      id: `insight-${id++}`,
      type: 'good',
      text: `Машаллах! Свободный остаток ${kpi.freeCash.toLocaleString()} ₸ — откройте халяль-депозит для роста баракат`,
      actionable: true,
    });
  }
  
  // Low emergency fund warning
  if (prevKpi && prevKpi.freeCash > 0) {
    const savingsRatio = kpi.freeCash / kpi.totalSpend;
    if (savingsRatio < 3) {
      insights.push({
        id: `insight-${id++}`,
        type: 'warning',
        text: `Подушка безопасности < 3 месяцев расходов. Рекомендуем откладывать минимум 10% дохода`,
        actionable: true,
      });
    }
  }
  
  // Charity encouragement
  if (cats['Благотворительность'] > 0) {
    insights.push({
      id: `insight-${id++}`,
      type: 'good',
      text: `Садака ${cats['Благотворительность'].toLocaleString()} ₸ — баракат в средствах! Аллах умножит добро`,
      category: 'Благотворительность',
    });
  }
  
  return insights;
}
