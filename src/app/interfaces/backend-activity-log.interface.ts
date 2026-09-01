export type LogAction = 'agregar' | 'editar' | 'eliminar';

export interface BackendActivityLog {
  id_activity_log: number;
  family_name: string;
  user_name: string;
  action: LogAction;
  detail: string;
  created_at: string;
}

export const LOG_ACTION_LABELS: Record<LogAction, string> = {
  agregar: 'Agregó',
  editar: 'Editó',
  eliminar: 'Eliminó',
};
