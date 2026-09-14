import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../../interfaces';
import { AuthService } from '../auth/auth.service';

interface LaravelValidationError {
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Único punto que llama al backend. Los servicios de cada módulo (registro,
 * login, usuarios, gastos, ...) usan esto en vez de HttpClient directo:
 *   this.helper.post('auth/login', { email, password })
 * Ya arma la URL, manda el Bearer token, desenvuelve { result, status, statusText }
 * y guarda el jwt renovado que manda el backend en cada respuesta.
 */
@Injectable({ providedIn: 'root' })
export class HelperService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    return this.http.get<ApiEnvelope<T>>(this.url(path), { headers: this.headers(), params }).pipe(
      map((res) => this.unwrap(res)),
      catchError((err) => this.toError(err)),
    );
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.post<ApiEnvelope<T>>(this.url(path), body, { headers: this.headers() }).pipe(
      map((res) => this.unwrap(res)),
      catchError((err) => this.toError(err)),
    );
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.put<ApiEnvelope<T>>(this.url(path), body, { headers: this.headers() }).pipe(
      map((res) => this.unwrap(res)),
      catchError((err) => this.toError(err)),
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiEnvelope<T>>(this.url(path), { headers: this.headers() }).pipe(
      map((res) => this.unwrap(res)),
      catchError((err) => this.toError(err)),
    );
  }

  private url(path: string): string {
    return `${environment.apiUrl}/${path.replace(/^\/+/, '')}`;
  }

  private headers(): HttpHeaders {
    const token = this.auth.token();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private unwrap<T>(res: ApiEnvelope<T>): T {
    if (res.jwt) this.auth.updateToken(res.jwt);
    return (res.result ?? null) as T;
  }

  private toError(err: HttpErrorResponse): Observable<never> {
    // Token vencido/ inválido: se cierra la sesión local, el guard se encarga de mandar a /login.
    if (err.status === 401) this.auth.logout();

    const body = err.error as (Partial<ApiEnvelope<unknown>> & LaravelValidationError) | null;
    const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    const message =
      firstFieldError ?? body?.statusText ?? body?.message ?? 'Error de conexión con el servidor.';
    return throwError(() => new Error(message));
  }
}
