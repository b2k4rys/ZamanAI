import { useMemo, useState, useEffect } from 'react';
import type { ReflectionMetrics, ReflectionSlideData, ReflectionData, ReflectionMonth } from '@/types/reflection';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

const REFLECTION_STORAGE_KEY = 'zaman.reflection.lastMonth';
const CUSTOMERS_STORAGE_KEY = 'zaman.customers.v1';
const ACTIVE_CUSTOMER_KEY = 'zaman.activeCustomerId';

type StoredTransaction = {
  id: string;
  date: string;
  amount: number;
  category?: string;
  merchant?: string;
  rawMerchant?: string;
  note?: string;
};

type StoredGoal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
};

type StoredCustomer = {
  id: string;
  name: string;
  txns: StoredTransaction[];
  goals?: StoredGoal[];
};

export function useReflection(selectedMonth?: string) {
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [goals, setGoals] = useState<StoredGoal[]>([]);
  const lastMonth = selectedMonth || getLastSelectedMonth();

  // Read data from localStorage
  useEffect(() => {
    try {
      const activeCustomerId = localStorage.getItem(ACTIVE_CUSTOMER_KEY);
      const customersJson = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      
      if (!customersJson || !activeCustomerId) {
        setTransactions([]);
        setGoals([]);
        return;
      }

      const customers: StoredCustomer[] = JSON.parse(customersJson);
      const activeCustomer = customers.find(c => c.id === activeCustomerId);
      
      if (activeCustomer) {
        setTransactions(activeCustomer.txns || []);
        setGoals(activeCustomer.goals || []);
      }
    } catch (e) {
      console.error('Failed to load customer data for reflection', e);
      setTransactions([]);
      setGoals([]);
    }
  }, [selectedMonth]);

  // Re-listen to goals:updated events
  useEffect(() => {
    const handleGoalsUpdated = () => {
      try {
        const activeCustomerId = localStorage.getItem(ACTIVE_CUSTOMER_KEY);
        const customersJson = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
        
        if (customersJson && activeCustomerId) {
          const customers: StoredCustomer[] = JSON.parse(customersJson);
          const activeCustomer = customers.find(c => c.id === activeCustomerId);
          
          if (activeCustomer) {
            setGoals(activeCustomer.goals || []);
          }
        }
      } catch (e) {
        console.error('Failed to reload goals', e);
      }
    };

    window.addEventListener('goals:updated', handleGoalsUpdated);
    return () => window.removeEventListener('goals:updated', handleGoalsUpdated);
  }, []);

  // Re-listen to goals:updated events
  useEffect(() => {
    const handleGoalsUpdated = () => {
      const data = calculateReflection(transactions, goals, lastMonth);
      // Force recalculation on goal updates
    };

    window.addEventListener('goals:updated', handleGoalsUpdated);
    return () => window.removeEventListener('goals:updated', handleGoalsUpdated);
  }, [transactions, goals, lastMonth]);

  const reflectionData = useMemo(() => {
    return calculateReflection(transactions, goals, lastMonth);
  }, [transactions, goals, lastMonth]);

  const saveLastMonth = (month: string) => {
    try {
      localStorage.setItem(REFLECTION_STORAGE_KEY, month);
    } catch (e) {
      console.error('Failed to save last reflection month', e);
    }
  };

  return {
    reflectionData,
    saveLastMonth,
  };
}

function getLastSelectedMonth(): string {
  try {
    const stored = localStorage.getItem(REFLECTION_STORAGE_KEY);
    if (stored) return stored;
  } catch (e) {
    console.error('Failed to load last reflection month', e);
  }
  // Default to previous month
  return format(subMonths(new Date(), 1), 'yyyy-MM');
}

function calculateReflection(
  transactions: StoredTransaction[],
  goals: StoredGoal[],
  monthStr: string
): ReflectionData {
  const monthDate = parseISO(`${monthStr}-01`);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  
  const prevMonthDate = subMonths(monthDate, 1);
  const prevStart = startOfMonth(prevMonthDate);
  const prevEnd = endOfMonth(prevMonthDate);

  // Filter transactions for current and previous month
  const txnsM = transactions.filter(t => {
    const date = parseISO(t.date);
    return date >= start && date <= end;
  });

  const txnsPrev = transactions.filter(t => {
    const date = parseISO(t.date);
    return date >= prevStart && date <= prevEnd;
  });

  // Calculate metrics for current month
  const metrics = calculateMetrics(txnsM, goals);
  const prevMetrics = calculateMetrics(txnsPrev, goals);

  // Calculate deltas
  metrics.deltaVsPrevious = {
    topUpCount: metrics.topUpCount - prevMetrics.topUpCount,
    foodCount: metrics.foodCount - prevMetrics.foodCount,
    savingsSum: metrics.savingsSum - prevMetrics.savingsSum,
    donationsCount: metrics.donationsCount - prevMetrics.donationsCount,
    totalSpend: metrics.totalSpend - prevMetrics.totalSpend,
  };

  const month: ReflectionMonth = {
    month: monthStr,
    year: monthDate.getFullYear(),
    monthName: format(monthDate, 'LLLL', { locale: ru }),
  };

  const slides = generateSlides(metrics, month);
  const captions = generateCaptions(metrics, month);

  return {
    month,
    metrics,
    slides,
    captions,
  };
}

function calculateMetrics(txns: StoredTransaction[], goals: StoredGoal[]): ReflectionMetrics {
  let incomeCount = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let foodCount = 0;
  let savingsSum = 0;
  let donationsCount = 0;
  const byCategory: Record<string, number> = {};

  txns.forEach(t => {
    // amount > 0 = income/top-up, amount < 0 = expense
    if (t.amount > 0) {
      incomeCount++;
      totalIncome += t.amount;
    } else if (t.amount < 0) {
      const amount = Math.abs(t.amount);
      totalExpense += amount;

      const category = t.category || 'Другое';
      byCategory[category] = (byCategory[category] || 0) + amount;

      if (category === 'Еда') {
        foodCount++;
      } else if (category === 'Благотворительность') {
        donationsCount++;
      }
    }
  });

  // Calculate savings from transactions with 'savings' category and positive amount
  txns.forEach(t => {
    if (t.category === 'Другое' && t.amount > 0) {
      savingsSum += t.amount;
    }
  });

  // Calculate goal progress with protection from NaN
  const goalProgress = goals.map(g => {
    const target = Number(g.targetAmount) || 0;
    const saved = Number(g.savedAmount) || 0;
    const progressPct = target > 0 ? (saved / target) * 100 : 0;
    
    return {
      goalId: g.id,
      name: g.name,
      delta: 0,
      current: saved,
      target: target,
      progressPct: Math.min(100, Math.max(0, progressPct)),
    };
  });

  return {
    topUpCount: incomeCount,
    foodCount,
    savingsSum,
    donationsCount,
    totalSpend: totalExpense,
    byCategory,
    goalProgress,
    deltaVsPrevious: {
      topUpCount: 0,
      foodCount: 0,
      savingsSum: 0,
      donationsCount: 0,
      totalSpend: 0,
    },
  };
}

function generateSlides(metrics: ReflectionMetrics, month: ReflectionMonth): ReflectionSlideData[] {
  const slides: ReflectionSlideData[] = [];

  // Slide 1: Summary
  slides.push({
    type: 'summary',
    title: `Твой финансовый ${month.monthName}`,
    emoji: '💸',
    data: {
      topUpCount: metrics.topUpCount,
      foodCount: metrics.foodCount,
      savingsSum: metrics.savingsSum,
      donationsCount: metrics.donationsCount,
      totalSpend: metrics.totalSpend,
    },
  });

  // Slide 2: Top categories
  const topCategories = Object.entries(metrics.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      percentage: (amount / metrics.totalSpend) * 100,
    }));

  slides.push({
    type: 'categories',
    title: 'Куда ушли деньги',
    emoji: '📊',
    data: { categories: topCategories, totalSpend: metrics.totalSpend },
  });

  // Slide 3: Goals (if any)
  if (metrics.goalProgress.length > 0) {
    // Find goal with largest target amount or first one
    const topGoal = metrics.goalProgress.reduce((max, g) => 
      (g.target || 0) > (max.target || 0) ? g : max
    , metrics.goalProgress[0]);
    
    const target = Number(topGoal.target) || 0;
    const current = Number(topGoal.current) || 0;
    const progressPct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    
    slides.push({
      type: 'goals',
      title: 'Прогресс к мечтам',
      emoji: '🎯',
      data: {
        goal: topGoal,
        progress: progressPct,
      },
    });
  }

  // Slide 4: Generosity
  if (metrics.donationsCount > 0 || metrics.savingsSum > 0) {
    slides.push({
      type: 'generosity',
      title: 'Твоя щедрость',
      emoji: '🌿',
      data: {
        donations: metrics.donationsCount,
        savings: metrics.savingsSum,
      },
    });
  }

  // Slide 5: CTA
  slides.push({
    type: 'cta',
    title: 'Что дальше?',
    emoji: '🚀',
    data: {},
  });

  return slides;
}

function generateCaptions(metrics: ReflectionMetrics, month: ReflectionMonth): string[] {
  const captions: string[] = [];

  captions.push(`Вот твой финансовый ${month.monthName}:`);
  captions.push(`💸 Пополнений: ${metrics.topUpCount}`);
  captions.push(`🍔 Трат на еду: ${metrics.foodCount}`);
  captions.push(`🏦 Накоплено: ${formatAmount(metrics.savingsSum)} ₸`);
  
  if (metrics.donationsCount > 0) {
    captions.push(`🌿 Пожертвований: ${metrics.donationsCount}`);
    captions.push('Щедрый месяц 🌿 — пусть добро возвращается.');
  }

  if (metrics.savingsSum > 0) {
    captions.push('Курс на будущие цели 🌅 — так держать!');
  }

  const foodDelta = metrics.deltaVsPrevious.foodCount;
  if (foodDelta > 2) {
    captions.push('Еда чуть растёт ↑ — хочешь запустить челлендж "Меньше доставок 7 дней"?');
  }

  if (metrics.goalProgress.length > 0) {
    const topGoal = metrics.goalProgress[0];
    const target = Number(topGoal.target) || 0;
    const current = Number(topGoal.current) || 0;
    const progress = target > 0 ? ((current / target) * 100).toFixed(1) : '0.0';
    captions.push(`Ты на ${progress}% ближе к мечте «${topGoal.name}».`);
  }

  return captions;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ru-KZ').format(Math.abs(amount));
}
