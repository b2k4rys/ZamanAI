import { useMemo } from 'react';
import type { Transaction } from '@/types/transaction';
import type { Goal } from '@/types/goal';
import type { ReflectionMetrics, ReflectionSlideData, ReflectionData, ReflectionMonth } from '@/types/reflection';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

const REFLECTION_STORAGE_KEY = 'zaman.reflection.lastMonth';

export function useReflection(
  transactions: Transaction[],
  goals: Goal[],
  selectedMonth?: string // YYYY-MM format
) {
  const lastMonth = selectedMonth || getLastSelectedMonth();

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
  transactions: Transaction[],
  goals: Goal[],
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

function calculateMetrics(txns: Transaction[], goals: Goal[]): ReflectionMetrics {
  let topUpCount = 0;
  let foodCount = 0;
  let savingsSum = 0;
  let donationsCount = 0;
  let totalSpend = 0;
  const byCategory: Record<string, number> = {};

  txns.forEach(t => {
    if (t.amount < 0) {
      // Credit (income/top-up)
      topUpCount++;
    } else {
      // Debit (expense)
      const amount = Math.abs(t.amount);
      totalSpend += amount;

      const category = t.category || 'Другое';
      byCategory[category] = (byCategory[category] || 0) + amount;

      if (category === 'Еда') {
        foodCount++;
      } else if (category === 'Благотворительность') {
        donationsCount++;
      }
    }
  });

  // Calculate savings from "savings" category transactions
  savingsSum = byCategory['Другое'] || 0; // Assuming savings are tracked as 'Другое' or specific category

  // Calculate goal progress (simplified - just show current state)
  const goalProgress = goals.map(g => ({
    goalId: g.id,
    name: g.title,
    delta: 0, // Could calculate monthly change if we had historical data
    current: g.currentAmount,
    target: g.targetAmount,
  }));

  return {
    topUpCount,
    foodCount,
    savingsSum,
    donationsCount,
    totalSpend,
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
    const topGoal = metrics.goalProgress[0];
    slides.push({
      type: 'goals',
      title: 'Прогресс к мечтам',
      emoji: '🎯',
      data: {
        goal: topGoal,
        progress: (topGoal.current / topGoal.target) * 100,
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
    const progress = ((topGoal.current / topGoal.target) * 100).toFixed(1);
    captions.push(`Ты на ${progress}% ближе к мечте «${topGoal.name}».`);
  }

  return captions;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ru-KZ').format(Math.abs(amount));
}
