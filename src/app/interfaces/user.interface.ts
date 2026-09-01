export type Role = 'admin' | 'esposa' | 'hijos';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
