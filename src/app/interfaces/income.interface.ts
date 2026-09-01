export interface Income {
  id: string;
  monthKey: string;
  label: string;
  amount: number;
  personId: string;
  personName: string;
}

export type IncomeInput = Pick<Income, 'label' | 'amount'>;
