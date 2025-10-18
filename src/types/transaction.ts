export type Category = 
  | 'Еда'
  | 'Транспорт'
  | 'Дом'
  | 'Подписки'
  | 'Развлечения'
  | 'Образование'
  | 'Здоровье'
  | 'Благотворительность'
  | 'Другое';

export interface Transaction {
  id: string;
  date: string; // ISO format
  amount: number; // negative for expenses
  rawMerchant: string;
  merchant?: string; // normalized
  category?: Category;
  mcc?: string;
  note?: string;
}

export interface Subscription {
  merchant: string;
  avgAmount: number;
  nextDate: string;
  active: boolean;
  frequency: number; // days between payments
}

export interface CategoryBreakdown {
  category: Category;
  amount: number;
  percentage: number;
  trend?: number; // vs previous period
}

export interface MerchantBreakdown {
  merchant: string;
  amount: number;
  percentage: number;
  count: number;
  avgTransaction: number;
  trend?: number;
  isSubscription?: boolean;
}

export interface KPI {
  totalSpend: number;
  byCategory: Record<Category, number>;
  byMerchant: Record<string, number>;
  freeCash: number;
  avgDailySpend: number;
}

export type InsightType = 'warning' | 'good' | 'tip';

export interface Insight {
  id: string;
  type: InsightType;
  text: string;
  category?: Category;
  merchant?: string;
  actionable?: boolean;
}
