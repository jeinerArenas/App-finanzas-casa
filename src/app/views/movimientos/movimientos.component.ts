import { ChangeDetectionStrategy, Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AuthService,
  CategoriasService,
  DeudasService,
  GastosService,
  IngresosService,
  MonthService,
  UsuariosService,
} from '../../servicios';
import {
  BackendCategory,
  BackendExpense,
  BackendIncome,
  BackendUser,
  EditarGastoPayload,
  GastoFormControls,
  IngresoFormControls,
  TableAction,
  TableColumn,
} from '../../interfaces';
import { formatCurrency } from '../../utils/currency';
import { getErrorMessage } from '../../utils/form-errors';
import { EDIT_ICON, TRASH_ICON } from '../../utils/icons';
import { DataTableComponent } from '../../componentes/data-table/data-table.component';

function defaultDateFor(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const now = new Date();
  if (now.getFullYear() === y && now.getMonth() + 1 === m) {
    return now.toISOString().slice(0, 10);
  }
  return `${monthKey}-01`;
}

@Component({
  selector: 'app-movimientos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DataTableComponent],
  templateUrl: './movimientos.component.html',
})
export class MovimientosComponent {
  private readonly ingresosService = inject(IngresosService);
  private readonly gastosService = inject(GastosService);
  private readonly deudasService = inject(DeudasService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly month = inject(MonthService);
  readonly canDelete = this.auth.isAdmin;
  readonly getErrorMessage = getErrorMessage;

  private readonly categoriaCellTpl = viewChild<TemplateRef<{ $implicit: BackendExpense }>>('categoriaCell');

  readonly incomeColumns: TableColumn<BackendIncome>[] = [
    { field: 'concept', header: 'Concepto' },
    { field: 'user_full_name', header: 'Quién', type: 'tag', tagClass: () => 'tag-neutral' },
    { field: 'amount', header: 'Monto', format: (row) => this.fmt(row.amount) },
  ];

  readonly incomeActions: TableAction<BackendIncome>[] = [
    { icon: EDIT_ICON, label: 'Editar', onClick: (row) => this.startEditIncome(row) },
    {
      icon: TRASH_ICON,
      label: 'Eliminar',
      onClick: (row) => this.deleteIncome(row.id_income),
      show: () => this.canDelete(),
    },
  ];

  readonly expenseColumns = computed<TableColumn<BackendExpense>[]>(() => [
    { field: 'expense_date', header: 'Fecha' },
    { field: 'category_name', header: 'Categoría', type: 'custom', cellTemplate: this.categoriaCellTpl() },
    { field: 'note', header: 'Nota', cellClass: () => 'text-muted' },
    { field: 'user_full_name', header: 'Quién', type: 'tag', tagClass: () => 'tag-neutral' },
    { field: 'amount', header: 'Monto', format: (row) => this.fmt(row.amount) },
  ]);

  readonly expenseActions: TableAction<BackendExpense>[] = [
    { icon: EDIT_ICON, label: 'Editar', onClick: (row) => this.startEditExpense(row) },
    {
      icon: TRASH_ICON,
      label: 'Eliminar',
      onClick: (row) => this.deleteExpense(row.id_expense),
      show: () => this.canDelete(),
    },
  ];

  readonly categorias = signal<BackendCategory[]>([]);
  readonly miembros = signal<BackendUser[]>([]);

  readonly incomes = computed(() =>
    this.ingresosService.ingresos().filter((i) => i.income_date.startsWith(this.month.monthKey())),
  );
  readonly expenses = computed(() =>
    this.gastosService.gastos().filter((g) => g.expense_date.startsWith(this.month.monthKey())),
  );

  readonly deudasActivas = computed(() =>
    this.deudasService.deudas().filter((d) => Number(d.pending_balance) > 0),
  );

  readonly selectedDebtId = signal<number | null>(null);
  readonly deudaSeleccionada = computed(
    () => this.deudasService.deudas().find((d) => d.id_debt === this.selectedDebtId()) ?? null,
  );
  readonly cuotasDisponibles = computed(() => {
    const deuda = this.deudaSeleccionada();
    if (!deuda) return [];
    const restantes = deuda.number_of_installments - deuda.installments_paid;
    return Array.from({ length: Math.max(restantes, 0) }, (_, i) => i + 1);
  });

  readonly editingDebtRow = signal<BackendExpense | null>(null);
  readonly editingDebtDescripcion = computed(() => {
    const row = this.editingDebtRow();
    if (!row) return '';
    return this.deudasService.deudas().find((d) => d.id_debt === row.id_debt)?.description ?? '';
  });

  readonly editingIncomeId = signal<number | null>(null);
  readonly incomeError = signal('');

  readonly incomeForm: FormGroup<IngresoFormControls> = this.fb.group({
    concept: this.fb.control('', Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    idUser: this.fb.control<number | null>(null, Validators.required),
    incomeDate: this.fb.control(defaultDateFor(this.month.monthKey()), Validators.required),
  });

  readonly editingExpenseId = signal<number | null>(null);
  readonly expenseError = signal('');

  readonly expenseForm: FormGroup<GastoFormControls> = this.fb.group({
    idCategory: this.fb.control<number | null>(null, Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    expenseDate: this.fb.control(defaultDateFor(this.month.monthKey()), Validators.required),
    note: this.fb.control(''),
    idUser: this.fb.control<number | null>(null, Validators.required),
    idDebt: this.fb.control<number | null>(null),
    installmentsCount: this.fb.control<number | null>(null),
  });

  constructor() {
    this.ingresosService.cargar();
    this.gastosService.cargar();
    this.deudasService.cargar();
    this.categoriasService.listar().subscribe((categorias) => this.categorias.set(categorias));
    this.usuariosService.listar().subscribe((miembros) => {
      this.miembros.set(miembros);
      const yo = this.auth.backendUser()?.id_user ?? null;
      this.incomeForm.controls.idUser.setValue(yo);
      this.expenseForm.controls.idUser.setValue(yo);
    });

    this.expenseForm.controls.idDebt.valueChanges.subscribe((idDebt) => this.onDebtSelectionChange(idDebt));
    this.expenseForm.controls.installmentsCount.valueChanges.subscribe(() => this.recalcularMontoDeuda());
  }

  saveOrAddIncome(): void {
    if (this.incomeForm.invalid) {
      this.incomeForm.markAllAsTouched();
      return;
    }

    this.incomeError.set('');
    const { concept, amount, idUser, incomeDate } = this.incomeForm.getRawValue();
    const payload = { concept, amount: amount as number, idUser: idUser as number, incomeDate };
    const editingId = this.editingIncomeId();
    const accion = editingId ? this.ingresosService.editar(editingId, payload) : this.ingresosService.crear(payload);

    accion.subscribe({
      next: () => this.resetIncomeForm(),
      error: (err: Error) => this.incomeError.set(err.message),
    });
  }

  startEditIncome(row: BackendIncome): void {
    this.editingIncomeId.set(row.id_income);
    this.incomeForm.setValue({
      concept: row.concept,
      amount: Number(row.amount),
      idUser: row.id_user,
      incomeDate: row.income_date,
    });
  }

  cancelEditIncome(): void {
    this.resetIncomeForm();
  }

  deleteIncome(id: number): void {
    this.ingresosService.eliminar(id).subscribe();
  }

  saveOrAddExpense(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const editingId = this.editingExpenseId();

    if (editingId) {
      this.updateExpense(editingId);
      return;
    }

    this.createExpense();
  }

  startEditExpense(row: BackendExpense): void {
    this.editingExpenseId.set(row.id_expense);
    this.editingDebtRow.set(row.id_debt !== null ? row : null);
    this.expenseForm.setValue(
      {
        idCategory: row.id_category,
        amount: Number(row.amount),
        expenseDate: row.expense_date,
        note: row.note ?? '',
        idUser: row.id_user,
        idDebt: null,
        installmentsCount: null,
      },
      { emitEvent: false },
    );

    if (row.id_debt !== null) {
      this.expenseForm.controls.amount.disable({ emitEvent: false });
    }
  }

  cancelEditExpense(): void {
    this.resetExpenseForm();
  }

  deleteExpense(id: number): void {
    const row = this.gastosService.gastos().find((g) => g.id_expense === id);

    this.gastosService.eliminar(id).subscribe(() => {
      if (row && row.id_debt !== null) {
        this.deudasService.cargar();
      }
    });
  }

  fmt(amount: string | number): string {
    return formatCurrency(Number(amount));
  }

  private createExpense(): void {
    const { idCategory, amount, expenseDate, note, idUser, idDebt, installmentsCount } =
      this.expenseForm.getRawValue();

    if (idDebt && !installmentsCount) {
      this.expenseError.set('Selecciona cuántas cuotas quieres pagar.');
      return;
    }

    this.expenseError.set('');
    const payload = {
      idCategory: idCategory as number,
      amount: amount as number,
      expenseDate,
      note,
      idUser: idUser as number,
      ...(idDebt ? { idDebt, installmentsCount: installmentsCount as number } : {}),
    };

    this.gastosService.crear(payload).subscribe({
      next: () => {
        this.resetExpenseForm();
        if (idDebt) this.deudasService.cargar();
      },
      error: (err: Error) => this.expenseError.set(err.message),
    });
  }

  private updateExpense(editingId: number): void {
    const { idCategory, amount, expenseDate, note, idUser } = this.expenseForm.getRawValue();
    const payload: EditarGastoPayload = {
      idCategory: idCategory as number,
      amount: amount as number,
      expenseDate,
      note,
      idUser: idUser as number,
    };

    this.expenseError.set('');
    this.gastosService.editar(editingId, payload).subscribe({
      next: () => this.resetExpenseForm(),
      error: (err: Error) => this.expenseError.set(err.message),
    });
  }

  private onDebtSelectionChange(idDebt: number | null): void {
    this.selectedDebtId.set(idDebt);
    this.expenseForm.controls.installmentsCount.setValue(null, { emitEvent: false });

    if (idDebt === null) {
      this.expenseForm.controls.amount.enable({ emitEvent: false });
      this.expenseForm.controls.amount.setValue(null, { emitEvent: false });
      return;
    }

    this.expenseForm.controls.amount.disable({ emitEvent: false });
    this.expenseForm.controls.amount.setValue(null, { emitEvent: false });

    const deuda = this.deudaSeleccionada();
    if (deuda && !this.expenseForm.controls.note.value) {
      this.expenseForm.controls.note.setValue(deuda.description, { emitEvent: false });
    }
  }

  private recalcularMontoDeuda(): void {
    const deuda = this.deudaSeleccionada();
    const cuotas = this.expenseForm.controls.installmentsCount.value;

    if (!deuda || !cuotas) return;

    const monto = Math.min(Number(deuda.installment_value) * cuotas, Number(deuda.pending_balance));
    this.expenseForm.controls.amount.setValue(Math.round(monto * 100) / 100, { emitEvent: false });
  }

  private resetIncomeForm(): void {
    this.editingIncomeId.set(null);
    this.incomeForm.reset({
      concept: '',
      amount: null,
      idUser: this.auth.backendUser()?.id_user ?? null,
      incomeDate: defaultDateFor(this.month.monthKey()),
    });
  }

  private resetExpenseForm(): void {
    this.editingExpenseId.set(null);
    this.editingDebtRow.set(null);
    this.selectedDebtId.set(null);
    this.expenseForm.controls.amount.enable({ emitEvent: false });
    this.expenseForm.reset({
      idCategory: null,
      amount: null,
      expenseDate: defaultDateFor(this.month.monthKey()),
      note: '',
      idUser: this.auth.backendUser()?.id_user ?? null,
      idDebt: null,
      installmentsCount: null,
    });
  }
}
