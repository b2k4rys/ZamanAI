import { Transaction } from "@/types/transaction";

export interface UserProfile {
  ageBand: string;
  city?: string;
}

export interface CohortPercentiles {
  p50: number;
  p75: number;
}

export interface Cohort {
  id: string;
  title: string;
  percentiles: Record<string, CohortPercentiles>;
}

export interface BenchmarkData {
  cohorts: Cohort[];
}

export interface ComparisonResult {
  category: string;
  userSpend: number;
  p50: number;
  p75: number;
  verdict: 'below' | 'near' | 'above';
  deltaPct: number;
}

const PROFILE_KEY = 'zaman.profile.v1';
const BENCHMARK_KEY = 'zaman.benchmark.v1';

// Default benchmark data (hardcoded fallback)
const DEFAULT_BENCHMARK: BenchmarkData = {
  cohorts: [
    {
      id: 'age_18_24',
      title: '18–24',
      percentiles: {
        'Еда': { p50: 70000, p75: 95000 },
        'Транспорт': { p50: 25000, p75: 40000 },
        'Подписки': { p50: 6000, p75: 12000 },
        'Развлечения': { p50: 15000, p75: 25000 },
        'Покупки': { p50: 30000, p75: 50000 },
      }
    },
    {
      id: 'age_25_34',
      title: '25–34',
      percentiles: {
        'Еда': { p50: 90000, p75: 120000 },
        'Транспорт': { p50: 30000, p75: 50000 },
        'Подписки': { p50: 8000, p75: 15000 },
        'Развлечения': { p50: 20000, p75: 35000 },
        'Покупки': { p50: 40000, p75: 65000 },
      }
    },
    {
      id: 'age_35_44',
      title: '35–44',
      percentiles: {
        'Еда': { p50: 110000, p75: 145000 },
        'Транспорт': { p50: 40000, p75: 65000 },
        'Подписки': { p50: 10000, p75: 18000 },
        'Развлечения': { p50: 25000, p75: 40000 },
        'Покупки': { p50: 50000, p75: 80000 },
      }
    },
    {
      id: 'age_45_plus',
      title: '45+',
      percentiles: {
        'Еда': { p50: 120000, p75: 160000 },
        'Транспорт': { p50: 35000, p75: 55000 },
        'Подписки': { p50: 12000, p75: 20000 },
        'Развлечения': { p50: 30000, p75: 45000 },
        'Покупки': { p50: 55000, p75: 90000 },
      }
    }
  ]
};

/**
 * Get user profile from localStorage
 */
export function getUserProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load user profile:', e);
  }
  return null;
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

/**
 * Get benchmark data from localStorage or use default
 */
export function getBenchmarkData(): BenchmarkData {
  try {
    const stored = localStorage.getItem(BENCHMARK_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load benchmark data:', e);
  }
  
  // Save default to localStorage
  try {
    localStorage.setItem(BENCHMARK_KEY, JSON.stringify(DEFAULT_BENCHMARK));
  } catch (e) {
    console.error('Failed to save default benchmark:', e);
  }
  
  return DEFAULT_BENCHMARK;
}

/**
 * Calculate monthly spend by category for the current month
 */
export function getUserMonthlySpend(txns: Transaction[], month?: Date): Record<string, number> {
  const targetMonth = month || new Date();
  const targetYear = targetMonth.getFullYear();
  const targetMonthNum = targetMonth.getMonth();
  
  const monthlyTxns = txns.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === targetYear && 
           d.getMonth() === targetMonthNum && 
           t.amount < 0; // Only expenses
  });
  
  const spendByCategory: Record<string, number> = {};
  
  monthlyTxns.forEach(t => {
    const cat = t.category || 'Другое';
    spendByCategory[cat] = (spendByCategory[cat] || 0) + Math.abs(t.amount);
  });
  
  return spendByCategory;
}

/**
 * Get cohort based on user profile
 */
export function getCohort(profile: UserProfile | null): Cohort | null {
  if (!profile) return null;
  
  const benchmarkData = getBenchmarkData();
  const cohort = benchmarkData.cohorts.find(c => c.title === profile.ageBand);
  
  return cohort || benchmarkData.cohorts[1]; // Default to 25-34
}

/**
 * Compare user spending with cohort
 */
export function compareWithCohort(
  userSpend: Record<string, number>,
  cohort: Cohort
): ComparisonResult[] {
  const results: ComparisonResult[] = [];
  
  Object.entries(cohort.percentiles).forEach(([category, percentiles]) => {
    const userAmount = userSpend[category] || 0;
    const { p50, p75 } = percentiles;
    
    let verdict: 'below' | 'near' | 'above';
    let deltaPct: number;
    
    if (userAmount === 0) {
      // No spending in this category
      verdict = 'below';
      deltaPct = -100;
    } else if (userAmount < p50 * 0.9) {
      verdict = 'below';
      deltaPct = ((userAmount - p50) / p50) * 100;
    } else if (userAmount > p75) {
      verdict = 'above';
      deltaPct = ((userAmount - p50) / p50) * 100;
    } else {
      verdict = 'near';
      deltaPct = ((userAmount - p50) / p50) * 100;
    }
    
    results.push({
      category,
      userSpend: userAmount,
      p50,
      p75,
      verdict,
      deltaPct: Math.round(deltaPct),
    });
  });
  
  return results.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
}

/**
 * Generate benchmark insights for tips
 */
export function generateBenchmarkInsights(
  txns: Transaction[],
  profile: UserProfile | null
): string[] {
  if (!profile) return [];
  
  const cohort = getCohort(profile);
  if (!cohort) return [];
  
  const userSpend = getUserMonthlySpend(txns);
  const comparison = compareWithCohort(userSpend, cohort);
  
  const insights: string[] = [];
  
  // Find categories where user is doing well (below average)
  const savingCategories = comparison.filter(c => c.verdict === 'below' && c.userSpend > 0);
  if (savingCategories.length > 0) {
    const best = savingCategories[0];
    insights.push(
      `Ты экономишь на **${Math.abs(best.deltaPct)}%** больше по категории "${best.category}", чем средний пользователь твоего возраста. Молодец! 👏`
    );
  }
  
  // Find categories where user could improve (above average)
  const overspendCategories = comparison.filter(c => c.verdict === 'above');
  if (overspendCategories.length > 0) {
    const worst = overspendCategories[0];
    insights.push(
      `Категория "${worst.category}" выше среднего на **${worst.deltaPct}%**. Хочешь поставить лимит или создать челлендж?`
    );
  }
  
  return insights;
}
