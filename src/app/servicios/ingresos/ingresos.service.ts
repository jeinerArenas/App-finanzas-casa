import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { ActividadService } from '../actividad/actividad.service';
import { BackendIncome, CrearIngresoPayload, EditarIngresoPayload } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class IngresosService {
  private readonly helper = inject(HelperService);
  private readonly actividad = inject(ActividadService);

  private readonly _ingresos = signal<BackendIncome[]>([]);
  readonly ingresos = this._ingresos.asReadonly();

  cargar(): void {
    this.helper
      .get<BackendIncome[]>('incomes')
      .subscribe((ingresos) => this._ingresos.set(ingresos));
  }

  crear(payload: CrearIngresoPayload): Observable<BackendIncome> {
    return this.helper.post<BackendIncome>('incomes', this.aBody(payload)).pipe(
      tap((creado) => {
        this._ingresos.update((lista) => [creado, ...lista]);
        this.actividad.registrar('agregar', `${creado.concept} · ${creado.amount}`);
      }),
    );
  }

  editar(idIncome: number, payload: EditarIngresoPayload): Observable<BackendIncome> {
    return this.helper.put<BackendIncome>(`incomes/${idIncome}`, this.aBody(payload)).pipe(
      tap((actualizado) => {
        this._ingresos.update((lista) =>
          lista.map((i) => (i.id_income === idIncome ? actualizado : i)),
        );
        this.actividad.registrar('editar', `${actualizado.concept} · ${actualizado.amount}`);
      }),
    );
  }

  private aBody(payload: CrearIngresoPayload): Record<string, unknown> {
    return {
      income_date: payload.incomeDate,
      concept: payload.concept,
      id_user: payload.idUser,
      amount: payload.amount,
    };
  }
}
