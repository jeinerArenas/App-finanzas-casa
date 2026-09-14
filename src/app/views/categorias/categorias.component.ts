import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CategoriasService, GastosService, MonthService } from '../../servicios';
import { ModalService } from '../../componentes/modal/modal.service';
import { TablaCbzV2Component } from '../../componentes/tabla-cbz-v2/tabla-cbz-v2.component';
import { CategoriaFormComponent } from './categoria-form/categoria-form.component';
import {
  BackendCategory,
  CategoriaResumen,
  CrearCategoriaPayload,
  IEventsTableCBZ,
  ITableCBZ,
} from '../../interfaces';
import { formatCurrency } from '../../utils/currency';
import { EDIT_ICON } from '../../utils/icons';

type OverCellTemplate = TemplateRef<{ $implicit: CategoriaResumen }>;

@Component({
  selector: 'app-categorias',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TablaCbzV2Component],
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent {
  private readonly categoriasService = inject(CategoriasService);
  private readonly gastosService = inject(GastosService);
  private readonly modal = inject(ModalService);
  protected readonly month = inject(MonthService);

  readonly error = signal('');

  private readonly overCellTpl = viewChild<OverCellTemplate>('overCell');

  readonly resumen = computed<CategoriaResumen[]>(() => {
    const monthKey = this.month.monthKey();
    const spentByCategory = new Map<number, number>();

    for (const gasto of this.gastosService.gastos()) {
      if (!gasto.expense_date.startsWith(monthKey)) continue;
      spentByCategory.set(
        gasto.id_category,
        (spentByCategory.get(gasto.id_category) ?? 0) + Number(gasto.amount),
      );
    }

    return this.categoriasService.categorias().map((categoria) => {
      const budget = Number(categoria.monthly_budget);
      const spent = spentByCategory.get(categoria.id_category) ?? 0;
      return {
        id_category: categoria.id_category,
        category_name: categoria.category_name,
        type_name: categoria.type_name,
        id_category_type: categoria.id_category_type,
        budget,
        spent,
        over: budget > 0 && spent > budget,
      };
    });
  });

  readonly tabla = computed<ITableCBZ<CategoriaResumen>>(() => ({
    data: this.resumen(),
    configurationColumns: {
      keys: ['category_name', 'type_name', 'budget', 'spent', 'over'],
      i18n: {
        category_name: $localize`:@@categorias.col.categoria:Categoría`,
        type_name: $localize`:@@categorias.col.tipo:Tipo`,
        budget: $localize`:@@categorias.col.presupuesto:Presupuesto`,
        spent: $localize`:@@categorias.col.gastado:Gastado`,
        over: '',
      },
      tagColumns: ['type_name'],
      tagClass: { type_name: () => 'tag-outline' },
      format: {
        budget: (c: CategoriaResumen) =>
          c.budget > 0 ? this.fmt(c.budget) : $localize`:@@categorias.sinLimite:Sin límite`,
        spent: (c: CategoriaResumen) => this.fmt(c.spent),
      },
      cellTemplates: this.buildCellTemplates(),
    },
    configurationRows: { keyColumn: 'id_category' },
    configurationActions: [
      { id: 'editar', icon: EDIT_ICON, label: $localize`:@@comun.editar:Editar` },
    ],
    stickyHeader: true,
    emptyMessage: $localize`:@@categorias.vacio:No hay categorías registradas.`,
  }));

  constructor() {
    this.categoriasService.cargar();
    this.gastosService.cargar();
  }

  onTableEvent(event: IEventsTableCBZ<CategoriaResumen>): void {
    if (event.type !== 'actionClick' || !event.row) return;
    if (event.action === 'editar') this.abrirEditar(event.row);
  }

  abrirCrear(): void {
    this.abrirFormulario(null);
  }

  fmt(amount: number): string {
    return formatCurrency(amount);
  }

  private abrirEditar(resumen: CategoriaResumen): void {
    const categoria = this.categoriasService
      .categorias()
      .find((c) => c.id_category === resumen.id_category);
    if (categoria) this.abrirFormulario(categoria);
  }

  private abrirFormulario(categoria: BackendCategory | null): void {
    this.modal
      .open<CategoriaFormComponent, { categoria: BackendCategory | null }, CrearCategoriaPayload>(
        CategoriaFormComponent,
        { categoria },
      )
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.guardarCategoria(payload, categoria);
      });
  }

  private guardarCategoria(
    payload: CrearCategoriaPayload,
    enEdicion: BackendCategory | null,
  ): void {
    const accion = enEdicion
      ? this.categoriasService.editar(enEdicion.id_category, payload)
      : this.categoriasService.crear(payload);

    accion.subscribe({
      next: () => this.error.set(''),
      error: (err: Error) => this.error.set(err.message),
    });
  }

  private buildCellTemplates(): Record<string, OverCellTemplate> {
    const over = this.overCellTpl();
    return over ? { over } : {};
  }
}
