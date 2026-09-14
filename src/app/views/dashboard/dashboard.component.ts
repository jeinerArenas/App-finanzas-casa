import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StatCardComponent } from '../../componentes';
import { TablaCbzV2Component } from '../../componentes/tabla-cbz-v2/tabla-cbz-v2.component';
import { DashboardService, GastosService, GoalService, IngresosService } from '../../servicios';
import { HistoryRow } from '../../servicios/dashboard.service';
import { GoalFormControls, ITableCBZ } from '../../interfaces';
import { formatCurrency } from '../../utils/currency';
import { getErrorMessage } from '../../utils/form-errors';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, StatCardComponent, DecimalPipe, TablaCbzV2Component],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly goalService = inject(GoalService);
  private readonly ingresosService = inject(IngresosService);
  private readonly gastosService = inject(GastosService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly dashboardService = inject(DashboardService);

  readonly summary = this.dashboardService.summary;
  readonly overBudgetCategories = this.dashboardService.overBudgetCategories;
  readonly goal = this.goalService.goal;
  readonly getErrorMessage = getErrorMessage;

  readonly historyTable = computed<ITableCBZ<HistoryRow>>(() => ({
    data: this.summary().historyRows,
    configurationColumns: {
      keys: ['label', 'incomeFmt', 'expenseFmt', 'savingsFmt'],
      i18n: {
        label: $localize`:@@dashboard.col.mes:Mes`,
        incomeFmt: $localize`:@@dashboard.col.ingresos:Ingresos`,
        expenseFmt: $localize`:@@dashboard.col.gastos:Gastos`,
        savingsFmt: $localize`:@@dashboard.col.ahorro:Ahorro`,
      },
      styleCell: {
        savingsFmt: (row: HistoryRow) => ({
          color: row.savingsPositive ? 'var(--color-accent-300)' : 'var(--color-neutral-400)',
        }),
      },
    },
    configurationRows: { keyColumn: 'key' },
    emptyMessage: $localize`:@@dashboard.historial.vacio:Todavía no hay meses registrados.`,
  }));

  readonly goalPct = computed(() => {
    const g = this.goal();
    if (!g) return 0;
    return Math.max(0, Math.min(100, (this.summary().cumTotal / Number(g.amount)) * 100));
  });
  readonly goalAmountFmt = computed(() => {
    const g = this.goal();
    return g ? formatCurrency(Number(g.amount)) : '';
  });
  readonly goalAchieved = computed(() => {
    const g = this.goal();
    return !!g && this.summary().cumTotal >= Number(g.amount);
  });
  readonly hasAlerts = computed(
    () => this.overBudgetCategories().length > 0 || this.goalAchieved(),
  );

  readonly goalForm: FormGroup<GoalFormControls> = this.fb.group({
    name: this.fb.control('', Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
  });

  constructor() {
    this.ingresosService.cargar();
    this.gastosService.cargar();
    this.goalService.cargar();
  }

  saveGoal(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    const { name, amount } = this.goalForm.getRawValue();
    this.goalService
      .set(name, amount as number)
      .subscribe(() => this.goalForm.reset({ name: '', amount: null }));
  }

  clearGoal(): void {
    this.goalService.clear().subscribe();
  }
}
