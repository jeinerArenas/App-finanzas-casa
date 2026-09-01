/** Sobre de respuesta que siempre devuelve el backend (App\Services\CommonService). */
export interface ApiEnvelope<T> {
  result?: T;
  status: number;
  statusText: string;
  jwt?: string;
}
