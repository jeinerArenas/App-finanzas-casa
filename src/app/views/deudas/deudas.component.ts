import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService, DeudasService } from '../../servicios';
import { ModalService } from '../../componentes/modal/modal.service';
import { DataTableComponent } from '../../componentes/data-table/data-table.component';
import { DeudaFormComponent } from './deuda-form/deuda-form.component';
import { BackendDebt, CrearDeudaPayload, TableAction, TableColumn } from '../../interfaces';
import { formatCurrency } from '../../utils/currency';
import { EDIT_ICON, TRASH_ICON } from '../../utils/icons';

interface EstadoTag {
  label: string;
  clase: string;
}

@Component({
  selector: 'app-deudas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent],
  templateUrl: './deudas.component.html',
})
export class DeudasComponent {
  private readonly deudasService = inject(DeudasService);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);

  readonly deudas = this.deudasService.deudas;
  readonly canDelete = this.auth.isAdmin;
  readonly error = signal('');

  readonly columns: TableColumn<BackendDebt>[] = [
    { field: 'description', header: 'Descripción' },
    { field: 'category_type_name', header: 'Tipo', type: 'tag', tagClass: () => 'tag-outline' },
    { field: 'total_amount', header: 'Monto total', format: (d) => this.fmt(d.total_amount) },
    { field: 'number_of_installments', header: 'Cuotas' },
    { field: 'installment_value', header: 'Valor cuota', format: (d) => this.fmt(d.installment_value) },
    { field: 'start_date', header: 'Fecha inicio' },
    { field: 'estimated_end_date', header: 'Fecha fin', format: (d) => d.estimated_end_date || '-' },
    { field: 'paid_to_date', header: 'Pagado a la fecha', format: (d) => this.fmt(d.paid_to_date) },
    { field: 'pending_balance', header: 'Saldo pendiente', format: (d) => this.fmt(d.pending_balance) },
    { field: 'porcentaje', header: '% pagado', format: (d) => `${this.porcentajePagado(d)}%` },
    {
      field: 'installments_paid',
      header: 'Cuotas pagadas',
      format: (d) => `${d.installments_paid} / ${d.number_of_installments}`,
    },
    {
      field: 'estado',
      header: 'Estado',
      type: 'tag',
      tagClass: (d) => this.estadoTag(d).clase,
      format: (d) => this.estadoTag(d).label,
    },
  ];

  readonly actions: TableAction<BackendDebt>[] = [
    { icon: EDIT_ICON, label: 'Editar', onClick: (d) => this.abrirEditar(d) },
    { icon: TRASH_ICON, label: 'Eliminar', onClick: (d) => this.eliminarDeuda(d), show: () => this.canDelete() },
  ];

  constructor() {
    this.deudasService.cargar();
  }

  abrirCrear(): void {
    this.abrirFormulario(null);
  }

  abrirEditar(deuda: BackendDebt): void {
    this.abrirFormulario(deuda);
  }

  private abrirFormulario(deuda: BackendDebt | null): void {
    this.modal
      .open<DeudaFormComponent, { deuda: BackendDebt | null }, CrearDeudaPayload>(DeudaFormComponent, { deuda })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.guardarDeuda(payload, deuda);
      });
  }

  private guardarDeuda(payload: CrearDeudaPayload, enEdicion: BackendDebt | null): void {
    const accion = enEdicion
      ? this.deudasService.editar(enEdicion.id_debt, payload)
      : this.deudasService.crear(payload);

    accion.subscribe({
      next: () => this.error.set(''),
      error: (err: Error) => this.error.set(err.message),
    });
  }

  eliminarDeuda(deuda: BackendDebt): void {
    this.deudasService.eliminar(deuda.id_debt).subscribe({
      next: () => this.error.set(''),
      error: (err: Error) => this.error.set(err.message),
    });
  }

  porcentajePagado(deuda: BackendDebt): number {
    if (!deuda.number_of_installments) return 0;
    return Math.round((deuda.installments_paid / deuda.number_of_installments) * 100);
  }

  estadoTag(deuda: BackendDebt): EstadoTag {
    const saldoPendiente = Number(deuda.pending_balance);

    if (saldoPendiente <= 0) return { label: 'Pagada', clase: 'tag-accent' };

    const hoy = new Date().toISOString().slice(0, 10);
    if (deuda.estimated_end_date && deuda.estimated_end_date < hoy) {
      return { label: 'Vencida', clase: 'tag-outline' };
    }

    return { label: 'En curso', clase: 'tag-neutral' };
  }

  fmt(amount: string | number): string {
    return formatCurrency(Number(amount));
  }
}
