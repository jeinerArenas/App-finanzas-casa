import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { ActividadService } from '../actividad/actividad.service';
import { BackendDebt, CrearDeudaPayload, EditarDeudaPayload } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class DeudasService {
  private readonly helper = inject(HelperService);
  private readonly actividad = inject(ActividadService);

  private readonly _deudas = signal<BackendDebt[]>([]);
  readonly deudas = this._deudas.asReadonly();

  cargar(): void {
    this.helper.get<BackendDebt[]>('debts').subscribe((deudas) => this._deudas.set(deudas));
  }

  crear(payload: CrearDeudaPayload): Observable<BackendDebt> {
    return this.helper.post<BackendDebt>('debts', this.aBody(payload)).pipe(
      tap((creada) => {
        this._deudas.update((lista) => [creada, ...lista]);
        this.actividad.registrar('agregar', `Deuda: ${creada.description}`);
      }),
    );
  }

  editar(idDebt: number, payload: EditarDeudaPayload): Observable<BackendDebt> {
    return this.helper.put<BackendDebt>(`debts/${idDebt}`, this.aBody(payload)).pipe(
      tap((actualizada) => {
        this._deudas.update((lista) => lista.map((d) => (d.id_debt === idDebt ? actualizada : d)));
        this.actividad.registrar('editar', `Deuda: ${actualizada.description}`);
      }),
    );
  }

  eliminar(idDebt: number): Observable<void> {
    const item = this._deudas().find((d) => d.id_debt === idDebt);

    return this.helper.delete<void>(`debts/${idDebt}`).pipe(
      tap(() => {
        this._deudas.update((lista) => lista.filter((d) => d.id_debt !== idDebt));
        if (item) this.actividad.registrar('eliminar', `Deuda: ${item.description}`);
      }),
    );
  }

  private aBody(payload: CrearDeudaPayload): Record<string, unknown> {
    return {
      description: payload.description,
      total_amount: payload.totalAmount,
      number_of_installments: payload.numberOfInstallments,
      installment_value: payload.installmentValue,
      start_date: payload.startDate,
      estimated_end_date: payload.estimatedEndDate,
      id_category_type: payload.idCategoryType,
    };
  }
}
