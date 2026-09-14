import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  BackendIncome,
  BackendUser,
  CrearIngresoPayload,
  IngresoFormControls,
} from '../../../interfaces';
import { getErrorMessage } from '../../../utils/form-errors';
import { ModalShellComponent } from '../../../componentes/modal/modal-shell.component';
import { INCOME_ICON } from '../../../utils/icons';

export interface IngresoFormData {
  ingreso: BackendIncome | null;
  miembros: BackendUser[];
  idUsuarioActual: number | null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-ingreso-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ModalShellComponent],
  templateUrl: './ingreso-form.component.html',
})
export class IngresoFormComponent {
  private readonly dialogRef = inject(MatDialogRef<IngresoFormComponent, CrearIngresoPayload>);
  private readonly data = inject<IngresoFormData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder).nonNullable;

  private readonly ingreso = () => this.data.ingreso;
  readonly esEdicion = this.ingreso() !== null;
  readonly miembros = this.data.miembros;
  readonly getErrorMessage = getErrorMessage;
  readonly icon = INCOME_ICON;
  readonly titulo = this.esEdicion
    ? $localize`:@@ingresos.ingreso.tituloEditar:Editar ingreso`
    : $localize`:@@ingresos.ingreso.tituloCrear:Nuevo ingreso del mes`;

  readonly form: FormGroup<IngresoFormControls> = this.fb.group({
    concept: this.fb.control(this.ingreso()?.concept ?? '', [
      Validators.required,
      Validators.maxLength(150),
    ]),
    amount: this.fb.control<number | null>(this.montoInicial(), [
      Validators.required,
      Validators.min(0.01),
    ]),
    idUser: this.fb.control<number | null>(
      this.ingreso()?.id_user ?? this.data.idUsuarioActual,
      Validators.required,
    ),
    incomeDate: this.fb.control(this.ingreso()?.income_date ?? todayIso(), Validators.required),
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { concept, amount, idUser, incomeDate } = this.form.getRawValue();
    this.dialogRef.close({
      concept,
      amount: amount as number,
      idUser: idUser as number,
      incomeDate,
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private montoInicial(): number | null {
    const ingreso = this.ingreso();
    return ingreso ? Number(ingreso.amount) : null;
  }
}
