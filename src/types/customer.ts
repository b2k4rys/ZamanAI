export type ExpenseCategory = 
  | 'Еда'
  | 'Транспорт'
  | 'Дом'
  | 'Подписки'
  | 'Одежда'
  | 'Развлечения'
  | 'Образование'
  | 'Благотворительность'
  | 'Другое';

export interface ExpenseRow {
  category: ExpenseCategory;
  amount: number;
}

export interface CustomerGoal {
  title: string;
  target: number;
}

export interface Customer {
  id: string;
  name: string;
  monthlyIncome: number;
  expenses: ExpenseRow[];
  savingsNow: number;
  goals?: CustomerGoal[];
  language: 'ru' | 'kk';
}
