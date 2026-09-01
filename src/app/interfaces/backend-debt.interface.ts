export interface BackendDebt {
  id_debt: number;
  description: string;
  id_category_type: number;
  total_amount: string;
  number_of_installments: number;
  installment_value: string;
  start_date: string;
  estimated_end_date: string | null;
  paid_to_date: string;
  pending_balance: string;
  installments_paid: number;
  id_debt_status: number;
  created_by_user: number;
  updated_by_user: number | null;
  created_at: string;
  updated_at: string;
  status_name: string;
  category_type_name: string;
  user_full_name: string;
}

export interface CrearDeudaPayload {
  description: string;
  totalAmount: number;
  numberOfInstallments: number;
  installmentValue: number;
  startDate: string;
  estimatedEndDate: string | null;
  idCategoryType: number;
}

export type EditarDeudaPayload = CrearDeudaPayload;
