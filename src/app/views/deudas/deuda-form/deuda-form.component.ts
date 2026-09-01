import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BackendDebt, CrearDeudaPayload, DeudaFormControls } from '../../../interfaces';
import { getErrorMessage } from '../../../utils/form-errors';
import { integerValidator } from '../../../utils/validators';
import { CATEGORY_TYPES } from '../../../utils/category-types';

export interface DeudaFormData {
  deuda: BackendDebt | null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(dateIso: string, months: number): string {
  const date = new Date(dateIso);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-deuda-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './deuda-form.component.html',
})
export class DeudaFormComponent {
  private readonly dialogRef = inject(MatDialogRef<DeudaFormComponent, CrearDeudaPayload>);
  private readonly data = inject<DeudaFormData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder).nonNullable;

  private readonly deuda = () => this.data.deuda;
  readonly esEdicion = this.deuda() !== null;
  readonly categoryTypes = CATEGORY_TYPES;
  readonly getErrorMessage = getErrorMessage;

  readonly form: FormGroup<DeudaFormControls> = this.fb.group({
    description: this.fb.control(this.deuda()?.description ?? '', [
      Validators.required,
      Validators.maxLength(150),
    ]),
    totalAmount: this.fb.control<number | null>(this.montoInicial('total_amount'), [
      Validators.required,
      Validators.min(0.01),
    ]),
    numberOfInstallments: this.fb.control<number | null>(this.deuda()?.number_of_installments ?? null, [
      Validators.required,
      Validators.min(1),
      integerValidator,
    ]),
    installmentValue: this.fb.control<number | null>(
      { value: this.montoInicial('installment_value'), disabled: true },
      [Validators.required, Validators.min(0.01)],
    ),
    startDate: this.fb.control(this.deuda()?.start_date ?? todayIso(), Validators.required),
    estimatedEndDate: this.fb.control(this.deuda()?.estimated_end_date ?? ''),
    idCategoryType: this.fb.control<number | null>(this.deuda()?.id_category_type ?? null, Validators.required),
  });

  constructor() {
    const deuda = this.deuda();

    if (deuda && deuda.installments_paid > 0) {
      this.form.controls.totalAmount.disable();
      this.form.controls.numberOfInstallments.disable();
    }

    this.form.controls.totalAmount.valueChanges.subscribe(() => this.recalcularCuota());
    this.form.controls.numberOfInstallments.valueChanges.subscribe(() => {
      this.recalcularCuota();
      this.recalcularFechaFin();
    });
    this.form.controls.startDate.valueChanges.subscribe(() => this.recalcularFechaFin());

    if (!this.esEdicion) {
      this.recalcularFechaFin();
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const {
      description,
      totalAmount,
      numberOfInstallments,
      installmentValue,
      startDate,
      estimatedEndDate,
      idCategoryType,
    } = this.form.getRawValue();

    this.dialogRef.close({
      description,
      totalAmount: totalAmount as number,
      numberOfInstallments: numberOfInstallments as number,
      installmentValue: installmentValue as number,
      startDate,
      estimatedEndDate: estimatedEndDate || null,
      idCategoryType: idCategoryType as number,
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private montoInicial(campo: 'total_amount' | 'installment_value'): number | null {
    const deuda = this.deuda();
    return deuda ? Number(deuda[campo]) : null;
  }

  private recalcularCuota(): void {
    const total = this.form.controls.totalAmount.value;
    const cuotas = this.form.controls.numberOfInstallments.value;

    if (!total || !cuotas || cuotas < 1) return;

    const valor = Math.round((total / cuotas) * 100) / 100;
    this.form.controls.installmentValue.setValue(valor, { emitEvent: false });
  }

  private recalcularFechaFin(): void {
    const inicio = this.form.controls.startDate.value;
    const cuotas = this.form.controls.numberOfInstallments.value;

    if (!inicio || !cuotas || cuotas < 1) return;

    this.form.controls.estimatedEndDate.setValue(addMonths(inicio, cuotas), { emitEvent: false });
  }
}
