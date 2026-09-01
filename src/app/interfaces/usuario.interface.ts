export interface CrearUsuarioPayload {
  documentNumber: string;
  fullName: string;
  email: string;
  idRole: number;
}

export interface EditarUsuarioPayload {
  documentNumber: string;
  fullName: string;
  email: string;
  idRole: number;
}
