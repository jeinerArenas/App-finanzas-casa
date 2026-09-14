export interface BackendSalary {
  id_salary: number;
  id_user: number;
  amount: string;
  start_date: string;
  end_date: string | null;
  created_by_user: number;
  updated_by_user: number | null;
  created_at: string;
  updated_at: string;
  user_full_name: string;
}

export interface CrearSalarioPayload {
  idUser: number;
  amount: number;
  startDate: string;
}

export type EditarSalarioPayload = CrearSalarioPayload;
