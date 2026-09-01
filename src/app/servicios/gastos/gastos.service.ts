import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { ActividadService } from '../actividad/actividad.service';
import { BackendExpense, CrearGastoPayload, EditarGastoPayload } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class GastosService {
  private readonly helper = inject(HelperService);
  private readonly actividad = inject(ActividadService);

  private readonly _gastos = signal<BackendExpense[]>([]);
  readonly gastos = this._gastos.asReadonly();

  cargar(): void {
    this.helper.get<BackendExpense[]>('expenses').subscribe((gastos) => this._gastos.set(gastos));
  }

  crear(payload: CrearGastoPayload): Observable<BackendExpense> {
    return this.helper.post<BackendExpense>('expenses', this.aBody(payload)).pipe(
      tap((creado) => {
        this._gastos.update((lista) => [creado, ...lista]);
        this.actividad.registrar('agregar', `${creado.category_name} · ${creado.amount}`);
      }),
    );
  }

  editar(idExpense: number, payload: EditarGastoPayload): Observable<BackendExpense> {
    return this.helper.put<BackendExpense>(`expenses/${idExpense}`, this.aBody(payload)).pipe(
      tap((actualizado) => {
        this._gastos.update((lista) => lista.map((g) => (g.id_expense === idExpense ? actualizado : g)));
        this.actividad.registrar('editar', `${actualizado.category_name} · ${actualizado.amount}`);
      }),
    );
  }

  eliminar(idExpense: number): Observable<void> {
    const item = this._gastos().find((g) => g.id_expense === idExpense);

    return this.helper.delete<void>(`expenses/${idExpense}`).pipe(
      tap(() => {
        this._gastos.update((lista) => lista.filter((g) => g.id_expense !== idExpense));
        if (item) this.actividad.registrar('eliminar', `${item.category_name} · ${item.amount}`);
      }),
    );
  }

  private aBody(payload: CrearGastoPayload | EditarGastoPayload): Record<string, unknown> {
    return {
      expense_date: payload.expenseDate,
      id_category: payload.idCategory,
      note: payload.note,
      id_user: payload.idUser,
      amount: payload.amount,
      ...('idDebt' in payload && payload.idDebt ? { id_debt: payload.idDebt } : {}),
      ...('installmentsCount' in payload && payload.installmentsCount
        ? { installments_count: payload.installmentsCount }
        : {}),
    };
  }
}
