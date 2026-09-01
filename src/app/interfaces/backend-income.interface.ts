export interface BackendIncome {
  id_income: number;
  income_date: string;
  concept: string;
  id_user: number;
  amount: string;
  created_by_user: number;
  updated_by_user: number | null;
  created_at: string;
  updated_at: string;
  user_full_name: string;
}

export interface CrearIngresoPayload {
  incomeDate: string;
  concept: string;
  idUser: number;
  amount: number;
}

export type EditarIngresoPayload = CrearIngresoPayload;
