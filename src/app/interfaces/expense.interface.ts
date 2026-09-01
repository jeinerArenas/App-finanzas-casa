export interface Expense {
  id: string;
  monthKey: string;
  category: string;
  amount: number;
  date: string;
  note: string;
  personId: string;
  personName: string;
}

export type ExpenseInput = Pick<Expense, 'category' | 'amount' | 'date' | 'note'>;
