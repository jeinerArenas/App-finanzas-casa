export interface BackendExpense {
  id_expense: number;
  expense_date: string;
  id_category: number;
  note: string | null;
  id_user: number;
  amount: string;
  id_debt: number | null;
  installments_count: number | null;
  id_category_type: number;
  created_by_user: number;
  updated_by_user: number | null;
  created_at: string;
  updated_at: string;
  category_name: string;
  type_name: string;
  user_full_name: string;
}

export interface CrearGastoPayload {
  expenseDate: string;
  idCategory: number;
  note: string;
  idUser: number;
  amount: number;
  idDebt?: number | null;
  installmentsCount?: number | null;
}

export interface EditarGastoPayload {
  expenseDate: string;
  idCategory: number;
  note: string;
  idUser: number;
  amount: number;
}
