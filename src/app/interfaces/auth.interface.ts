export interface BackendUser {
  id_user: number;
  document_number: string;
  full_name: string;
  email: string;
  family_name: string;
  id_role: number;
  is_admin: boolean;
  registration_date: string;
  active: boolean;
  role_name: string;
}

export interface AuthResult {
  user: BackendUser;
  token: string;
}

export interface RegistroPayload {
  documentNumber: string;
  fullName: string;
  email: string;
  password: string;
  familyName: string;
}
