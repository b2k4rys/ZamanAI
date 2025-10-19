export type ReflectionMonth = {
  month: string; // YYYY-MM format
  year: number;
  monthName: string;
};

export type ReflectionMetrics = {
  topUpCount: number;
  foodCount: number;
  savingsSum: number;
  donationsCount: number;
  totalSpend: number;
  byCategory: Record<string, number>;
  goalProgress: {
    goalId: string;
    name: string;
    delta: number; // percentage gain this month
    current: number;
    target: number;
  }[];
  deltaVsPrevious: {
    topUpCount: number;
    foodCount: number;
    savingsSum: number;
    donationsCount: number;
    totalSpend: number;
  };
};

export type ReflectionSlideData = {
  type: 'summary' | 'categories' | 'goals' | 'generosity' | 'cta';
  title: string;
  subtitle?: string;
  emoji?: string;
  data?: any;
};

export type ReflectionData = {
  month: ReflectionMonth;
  metrics: ReflectionMetrics;
  slides: ReflectionSlideData[];
  captions: string[];
};
