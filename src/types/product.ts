export type ProductKind = 'deposit' | 'ijara' | 'murabaha' | 'invest' | 'card';
export type ProductBadge = 'Рекомендовано' | 'Популярно' | 'Для целей' | 'Новинка';
export type ProductIcon = 'growth' | 'shield' | 'wallet' | 'home' | 'car';

export interface Product {
  id: string;
  name: string;
  kind: ProductKind;
  halal: true;
  tagline: string;
  description: string;
  aprFrom?: number;
  badge?: ProductBadge;
  icon: ProductIcon;
}

export interface Recommendation {
  product: Product;
  score: number;
  why: string[];
}
