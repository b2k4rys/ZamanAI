import { Transaction } from "./transaction";

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

export type Category = ExpenseCategory;

export interface ExpenseRow {
  category: ExpenseCategory;
  amount: number;
}

export interface CustomerGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  createdAt: string;
  updatedAt: string;
  icon?: string;
}

export interface Customer {
  id: string;
  name: string;
  monthlyIncome: number;
  expenses: ExpenseRow[];
  savingsNow: number;
  goals?: CustomerGoal[];
  language: 'ru' | 'kk';
  txns: Transaction[];
}

export type { Transaction };
