import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AuthService,
  CategoriasService,
  DeudasService,
  GastosService,
  MonthService,
  UsuariosService,
} from '../../servicios';
import { ModalService } from '../../componentes/modal/modal.service';
import { TablaCbzV2Component } from '../../componentes/tabla-cbz-v2/tabla-cbz-v2.component';
import { GastoFormComponent, GastoFormData } from './gasto-form/gasto-form.component';
import {
  BackendCategory,
  BackendExpense,
  BackendUser,
  CrearGastoPayload,
  IEventsTableCBZ,
  ITableCBZ,
} from '../../interfaces';
import { formatCurrency } from '../../utils/currency';
import { EDIT_ICON, TRASH_ICON } from '../../utils/icons';

@Component({
  selector: 'app-gastos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TablaCbzV2Component],
  templateUrl: './gastos.component.html',
})
export class GastosComponent {
  private readonly gastosService = inject(GastosService);
  private readonly deudasService = inject(DeudasService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  protected readonly month = inject(MonthService);

  readonly canDelete = this.auth.isAdmin;
  readonly error = signal('');

  private readonly categoriaCellTpl =
    viewChild<TemplateRef<{ $implicit: BackendExpense }>>('categoriaCell');

  readonly categorias = signal<BackendCategory[]>([]);
  readonly miembros = signal<BackendUser[]>([]);

  readonly expenses = computed(() =>
    this.gastosService.gastos().filter((g) => g.expense_date.startsWith(this.month.monthKey())),
  );
  readonly deudasActivas = computed(() =>
    this.deudasService.deudas().filter((d) => Number(d.pending_balance) > 0),
  );

  readonly tabla = computed<ITableCBZ<BackendExpense>>(() => ({
    data: this.expenses(),
    configurationColumns: {
      keys: ['expense_date', 'category_name', 'note', 'user_full_name', 'amount'],
      i18n: {
        expense_date: $localize`:@@movimientos.col.fecha:Fecha`,
        category_name: $localize`:@@movimientos.col.categoria:Categoría`,
        note: $localize`:@@movimientos.col.nota:Nota`,
        user_full_name: $localize`:@@movimientos.col.quien:Quién`,
        amount: $localize`:@@movimientos.col.monto:Monto`,
      },
      tagColumns: ['user_full_name'],
      style: { note: { color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' } },
      format: { amount: (row: BackendExpense) => this.fmt(row.amount) },
      cellTemplates: this.buildTemplates(),
    },
    configurationRows: { keyColumn: 'id_expense' },
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
    emptyMessage: $localize`:@@movimientos.gastos.vacio:Aún no hay gastos registrados este mes.`,
  }));

  constructor() {
    this.gastosService.cargar();
    this.deudasService.cargar();
    this.categoriasService.listar().subscribe((categorias) => this.categorias.set(categorias));
    this.usuariosService.listar().subscribe((miembros) => this.miembros.set(miembros));
  }

  onTableEvent(event: IEventsTableCBZ<BackendExpense>): void {
    if (event.type !== 'actionClick' || !event.row) return;
    if (event.action === 'editar') this.abrirFormulario(event.row);
    if (event.action === 'eliminar') this.eliminarGasto(event.row);
  }

  abrirCrear(): void {
    this.abrirFormulario(null);
  }

  fmt(amount: string | number): string {
    return formatCurrency(Number(amount));
  }

  private abrirFormulario(gasto: BackendExpense | null): void {
    this.modal
      .open<GastoFormComponent, GastoFormData, CrearGastoPayload>(GastoFormComponent, {
        gasto,
        categorias: this.categorias(),
        miembros: this.miembros(),
        deudasActivas: this.deudasActivas(),
        idUsuarioActual: this.auth.backendUser()?.id_user ?? null,
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.guardarGasto(payload, gasto);
      });
  }

  private guardarGasto(payload: CrearGastoPayload, enEdicion: BackendExpense | null): void {
    const accion = enEdicion
      ? this.gastosService.editar(enEdicion.id_expense, payload)
      : this.gastosService.crear(payload);

    accion.subscribe({
      next: () => {
        this.error.set('');
        if (payload.idDebt) this.deudasService.cargar();
      },
      error: (err: Error) => this.error.set(err.message),
    });
  }

  private eliminarGasto(gasto: BackendExpense): void {
    this.gastosService.eliminar(gasto.id_expense).subscribe(() => {
      if (gasto.id_debt !== null) this.deudasService.cargar();
    });
  }

  private buildTemplates(): Record<string, TemplateRef<{ $implicit: BackendExpense }>> {
    const tpl = this.categoriaCellTpl();
    return tpl ? { category_name: tpl } : {};
  }
}
