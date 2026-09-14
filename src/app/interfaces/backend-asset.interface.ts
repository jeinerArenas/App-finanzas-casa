export interface BackendAsset {
  id_asset: number;
  id_user: number;
  name: string;
  value: string;
  created_by_user: number;
  updated_by_user: number | null;
  created_at: string;
  updated_at: string;
  user_full_name: string;
}

export interface CrearActivoPayload {
  idUser: number;
  name: string;
  value: number;
}

export type EditarActivoPayload = CrearActivoPayload;
