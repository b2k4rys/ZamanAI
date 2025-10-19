import { Transaction } from "./transaction";
import { Goal } from "./goal";

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

export type CustomerGoal = Goal;

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
