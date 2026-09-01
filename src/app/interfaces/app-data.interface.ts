import { Expense } from './expense.interface';
import { Income } from './income.interface';

export interface MonthBucket {
  incomes: Income[];
  expenses: Expense[];
}

export interface AppData {
  months: Record<string, MonthBucket>;
  categories: string[];
  budgets: Record<string, number>;
}

export function emptyAppData(): AppData {
  return { months: {}, categories: [], budgets: {} };
}
