export interface BackendCategory {
  id_category: number;
  category_name: string;
  monthly_budget: string;
  id_category_type: number;
  type_name: string;
}

export interface CrearCategoriaPayload {
  categoryName: string;
  idCategoryType: number;
  monthlyBudget: number | null;
}

export type EditarCategoriaPayload = CrearCategoriaPayload;

export interface CategoriaResumen {
  id_category: number;
  category_name: string;
  type_name: string;
  id_category_type: number;
  budget: number;
  spent: number;
  over: boolean;
}
