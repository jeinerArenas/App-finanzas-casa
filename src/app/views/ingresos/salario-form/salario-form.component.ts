import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  BackendSalary,
  BackendSalaryVariable,
  BackendUser,
  SalarioFormControls,
} from '../../../interfaces';
import { getErrorMessage } from '../../../utils/form-errors';
import { ModalShellComponent } from '../../../componentes/modal/modal-shell.component';
import { SALARY_ICON } from '../../../utils/icons';

export interface SalarioFormData {
  salario: BackendSalary | null;
  variableActual: BackendSalaryVariable | null;
  miembros: BackendUser[];
  idUsuarioActual: number | null;
}

export interface SalarioFormVariable {
  description: string;
  amount: number;
}

export interface SalarioFormResult {
  idUser: number;
  amount: number;
  startDate: string;
  variable: SalarioFormVariable | null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-salario-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ModalShellComponent],
  templateUrl: './salario-form.component.html',
})
export class SalarioFormComponent {
  private readonly dialogRef = inject(MatDialogRef<SalarioFormComponent, SalarioFormResult>);
  private readonly data = inject<SalarioFormData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder).nonNullable;

  private readonly salario = () => this.data.salario;
  readonly esEdicion = this.salario() !== null;
  readonly miembros = this.data.miembros;
  readonly getErrorMessage = getErrorMessage;
  readonly icon = SALARY_ICON;
  readonly titulo = this.esEdicion
    ? $localize`:@@ingresos.salario.tituloEditar:Editar salario`
    : $localize`:@@ingresos.salario.tituloCrear:Registrar salario`;

  readonly form: FormGroup<SalarioFormControls> = this.fb.group({
    idUser: this.fb.control<number | null>(
      this.salario()?.id_user ?? this.data.idUsuarioActual,
      Validators.required,
    ),
    amount: this.fb.control<number | null>(this.montoInicial(), [
      Validators.required,
      Validators.min(0.01),
    ]),
    startDate: this.fb.control(this.salario()?.start_date ?? todayIso(), Validators.required),
    variableAmount: this.fb.control<number | null>(
      this.variableMontoInicial(),
      Validators.min(0.01),
    ),
    variableDescription: this.fb.control(
      this.data.variableActual?.description ?? '',
      Validators.maxLength(150),
    ),
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { idUser, amount, startDate, variableAmount, variableDescription } =
      this.form.getRawValue();

    this.dialogRef.close({
      idUser: idUser as number,
      amount: amount as number,
      startDate,
      variable: variableAmount
        ? { description: variableDescription, amount: variableAmount }
        : null,
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private montoInicial(): number | null {
    const salario = this.salario();
    return salario ? Number(salario.amount) : null;
  }

  private variableMontoInicial(): number | null {
    const variable = this.data.variableActual;
    return variable ? Number(variable.amount) : null;
  }
}
