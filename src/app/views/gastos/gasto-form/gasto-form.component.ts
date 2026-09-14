import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeudasService } from '../../../servicios';
import {
  BackendCategory,
  BackendDebt,
  BackendExpense,
  BackendUser,
  CrearGastoPayload,
  GastoFormControls,
} from '../../../interfaces';
import { formatCurrency } from '../../../utils/currency';
import { getErrorMessage } from '../../../utils/form-errors';
import { ModalShellComponent } from '../../../componentes/modal/modal-shell.component';
import { RECEIPT_ICON } from '../../../utils/icons';

export interface GastoFormData {
  gasto: BackendExpense | null;
  categorias: BackendCategory[];
  miembros: BackendUser[];
  deudasActivas: BackendDebt[];
  idUsuarioActual: number | null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-gasto-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ModalShellComponent],
  templateUrl: './gasto-form.component.html',
})
export class GastoFormComponent {
  private readonly dialogRef = inject(MatDialogRef<GastoFormComponent, CrearGastoPayload>);
  private readonly data = inject<GastoFormData>(MAT_DIALOG_DATA);
  private readonly deudasService = inject(DeudasService);
  private readonly fb = inject(FormBuilder).nonNullable;

  private readonly gasto = () => this.data.gasto;
  readonly esEdicion = this.gasto() !== null;
  readonly categorias = this.data.categorias;
  readonly miembros = this.data.miembros;
  readonly deudasActivas = this.data.deudasActivas;
  readonly getErrorMessage = getErrorMessage;
  readonly error = signal('');
  readonly icon = RECEIPT_ICON;
  readonly titulo = this.esEdicion
    ? $localize`:@@gastos.form.tituloEditar:Editar gasto`
    : $localize`:@@gastos.form.tituloCrear:Registrar gasto`;

  readonly editingDebtRow = signal<BackendExpense | null>(
    this.gasto()?.id_debt != null ? this.gasto() : null,
  );
  readonly selectedDebtId = signal<number | null>(null);

  readonly deudaSeleccionada = computed(
    () => this.deudasActivas.find((d) => d.id_debt === this.selectedDebtId()) ?? null,
  );
  readonly cuotasDisponibles = computed(() => {
    const deuda = this.deudaSeleccionada();
    if (!deuda) return [];
    const restantes = deuda.number_of_installments - deuda.installments_paid;
    return Array.from({ length: Math.max(restantes, 0) }, (_, i) => i + 1);
  });
  readonly editingDebtDescripcion = computed(() => {
    const row = this.editingDebtRow();
    if (!row) return '';
    return this.deudasService.deudas().find((d) => d.id_debt === row.id_debt)?.description ?? '';
  });

  readonly form: FormGroup<GastoFormControls> = this.fb.group({
    idCategory: this.fb.control<number | null>(
      this.gasto()?.id_category ?? null,
      Validators.required,
    ),
    amount: this.fb.control<number | null>(this.montoInicial(), [
      Validators.required,
      Validators.min(0.01),
    ]),
    expenseDate: this.fb.control(this.gasto()?.expense_date ?? todayIso(), Validators.required),
    note: this.fb.control(this.gasto()?.note ?? ''),
    idUser: this.fb.control<number | null>(
      this.gasto()?.id_user ?? this.data.idUsuarioActual,
      Validators.required,
    ),
    idDebt: this.fb.control<number | null>(null),
    installmentsCount: this.fb.control<number | null>(null),
  });

  constructor() {
    if (this.gasto()?.id_debt != null) {
      this.form.controls.amount.disable();
    }

    this.form.controls.idDebt.valueChanges.subscribe((idDebt) =>
      this.onDebtSelectionChange(idDebt),
    );
    this.form.controls.installmentsCount.valueChanges.subscribe(() => this.recalcularMontoDeuda());
  }

  fmt(amount: string | number): string {
    return formatCurrency(Number(amount));
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { idCategory, amount, expenseDate, note, idUser, idDebt, installmentsCount } =
      this.form.getRawValue();

    if (!this.esEdicion && idDebt && !installmentsCount) {
      this.error.set(
        $localize`:@@gastos.form.errorCuotas:Selecciona cuántas cuotas quieres pagar.`,
      );
      return;
    }

    this.dialogRef.close({
      idCategory: idCategory as number,
      amount: amount as number,
      expenseDate,
      note,
      idUser: idUser as number,
      ...(!this.esEdicion && idDebt
        ? { idDebt, installmentsCount: installmentsCount as number }
        : {}),
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private montoInicial(): number | null {
    const gasto = this.gasto();
    return gasto ? Number(gasto.amount) : null;
  }

  private onDebtSelectionChange(idDebt: number | null): void {
    this.selectedDebtId.set(idDebt);
    this.form.controls.installmentsCount.setValue(null, { emitEvent: false });

    if (idDebt === null) {
      this.form.controls.amount.enable({ emitEvent: false });
      this.form.controls.amount.setValue(null, { emitEvent: false });
      return;
    }

    this.form.controls.amount.disable({ emitEvent: false });
    this.form.controls.amount.setValue(null, { emitEvent: false });

    const deuda = this.deudaSeleccionada();
    if (deuda && !this.form.controls.note.value) {
      this.form.controls.note.setValue(deuda.description, { emitEvent: false });
    }
  }

  private recalcularMontoDeuda(): void {
    const deuda = this.deudaSeleccionada();
    const cuotas = this.form.controls.installmentsCount.value;

    if (!deuda || !cuotas) return;

    const monto = Math.min(Number(deuda.installment_value) * cuotas, Number(deuda.pending_balance));
    this.form.controls.amount.setValue(Math.round(monto * 100) / 100, { emitEvent: false });
  }
}
