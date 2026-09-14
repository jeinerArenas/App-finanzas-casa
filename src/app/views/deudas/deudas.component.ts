import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService, DeudasService } from '../../servicios';
import { ModalService } from '../../componentes/modal/modal.service';
import { TablaCbzV2Component } from '../../componentes/tabla-cbz-v2/tabla-cbz-v2.component';
import { DeudaFormComponent } from './deuda-form/deuda-form.component';
import {
  BackendDebt,
  CrearDeudaPayload,
  DeudaEstadoTag,
  IEventsTableCBZ,
  ITableCBZ,
} from '../../interfaces';
import { formatCurrency } from '../../utils/currency';
import { EDIT_ICON, TRASH_ICON } from '../../utils/icons';

@Component({
  selector: 'app-deudas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TablaCbzV2Component],
  templateUrl: './deudas.component.html',
})
export class DeudasComponent {
  private readonly deudasService = inject(DeudasService);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);

  readonly deudas = this.deudasService.deudas;
  readonly canDelete = this.auth.isAdmin;
  readonly error = signal('');

  readonly tabla = computed<ITableCBZ<BackendDebt>>(() => ({
    data: this.deudas(),
    configurationColumns: {
      keys: [
        'description',
        'category_type_name',
        'total_amount',
        // 'number_of_installments',
        'installment_value',
        'start_date',
        'estimated_end_date',
        'paid_to_date',
        'pending_balance',
        'porcentaje',
        'installments_paid',
        'estado',
      ],
      i18n: {
        description: $localize`:@@deudas.col.descripcion:Descripción`,
        category_type_name: $localize`:@@deudas.col.tipo:Tipo`,
        total_amount: $localize`:@@deudas.col.montoTotal:Monto total`,
        // number_of_installments: $localize`:@@deudas.col.cuotas:Cuotas`,
        installment_value: $localize`:@@deudas.col.valorCuota:Valor cuota`,
        start_date: $localize`:@@deudas.col.fechaInicio:Fecha inicio`,
        estimated_end_date: $localize`:@@deudas.col.fechaFin:Fecha fin`,
        paid_to_date: $localize`:@@deudas.col.pagado:Pagado a la fecha`,
        pending_balance: $localize`:@@deudas.col.saldo:Saldo pendiente`,
        porcentaje: $localize`:@@deudas.col.porcentaje:% pagado`,
        installments_paid: $localize`:@@deudas.col.cuotasPagadas:Cuotas pagadas`,
        estado: $localize`:@@deudas.col.estado:Estado`,
      },
      leftedColumns: ['description'],
      tagColumns: ['category_type_name', 'estado'],
      tagClass: {
        category_type_name: () => 'tag-outline',
        estado: (deuda: BackendDebt) => this.estadoTag(deuda).clase,
      },
      format: {
        total_amount: (deuda: BackendDebt) => this.fmt(deuda.total_amount),
        installment_value: (deuda: BackendDebt) => this.fmt(deuda.installment_value),
        estimated_end_date: (deuda: BackendDebt) => deuda.estimated_end_date || '-',
        paid_to_date: (deuda: BackendDebt) => this.fmt(deuda.paid_to_date),
        pending_balance: (deuda: BackendDebt) => this.fmt(deuda.pending_balance),
        porcentaje: (deuda: BackendDebt) => `${this.porcentajePagado(deuda)}%`,
        installments_paid: (deuda: BackendDebt) =>
          `${deuda.installments_paid} / ${deuda.number_of_installments}`,
        estado: (deuda: BackendDebt) => this.estadoTag(deuda).label,
      },
    },
    configurationPagination: { visible: true, pageSize: 10, pageSizeOptions: [10, 20, 30, 40] },
    configurationExport: { fileName: $localize`:@@deudas.export.archivo:deudas` },
    configurationRows: { keyColumn: 'id_debt' },
    configurationActions: [
      { id: 'editar', icon: EDIT_ICON, label: $localize`:@@comun.editar:Editar` },
      {
        id: 'eliminar',
        icon: TRASH_ICON,
        label: $localize`:@@comun.eliminar:Eliminar`,
        show: () => this.canDelete(),
      },
    ],
    stickyHeader: true,
    emptyMessage: $localize`:@@deudas.vacio:Aún no hay deudas registradas.`,
  }));

  constructor() {
    this.deudasService.cargar();
  }

  onTableEvent(event: IEventsTableCBZ<BackendDebt>): void {
    if (event.type !== 'actionClick' || !event.row) return;
    if (event.action === 'editar') this.abrirEditar(event.row);
    if (event.action === 'eliminar') this.eliminarDeuda(event.row);
  }

  abrirCrear(): void {
    this.abrirFormulario(null);
  }

  abrirEditar(deuda: BackendDebt): void {
    this.abrirFormulario(deuda);
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

  estadoTag(deuda: BackendDebt): DeudaEstadoTag {
    const saldoPendiente = Number(deuda.pending_balance);

    if (saldoPendiente <= 0) {
      return { label: $localize`:@@deudas.estado.pagada:Pagada`, clase: 'tag-accent' };
    }

    const hoy = new Date().toISOString().slice(0, 10);
    if (deuda.estimated_end_date && deuda.estimated_end_date < hoy) {
      return { label: $localize`:@@deudas.estado.vencida:Vencida`, clase: 'tag-outline' };
    }

    return { label: $localize`:@@deudas.estado.enCurso:En curso`, clase: 'tag-neutral' };
  }

  fmt(amount: string | number): string {
    return formatCurrency(Number(amount));
  }

  private abrirFormulario(deuda: BackendDebt | null): void {
    this.modal
      .open<DeudaFormComponent, { deuda: BackendDebt | null }, CrearDeudaPayload>(
        DeudaFormComponent,
        { deuda },
      )
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
}
