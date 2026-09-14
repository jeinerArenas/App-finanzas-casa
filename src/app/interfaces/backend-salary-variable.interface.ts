export interface BackendSalaryVariable {
  id_salary_variable: number;
  id_salary: number;
  description: string | null;
  amount: string;
  start_date: string;
  end_date: string | null;
  created_by_user: number;
  updated_by_user: number | null;
  created_at: string;
  updated_at: string;
  id_user: number;
  user_full_name: string;
}

export interface CrearVariablePayload {
  description: string;
  amount: number;
  startDate: string;
}

export interface EditarVariablePayload {
  description: string;
  amount: number;
}
