import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ActivoFormControls,
  BackendAsset,
  BackendUser,
  CrearActivoPayload,
} from '../../../interfaces';
import { getErrorMessage } from '../../../utils/form-errors';
import { ModalShellComponent } from '../../../componentes/modal/modal-shell.component';
import { ASSET_ICON } from '../../../utils/icons';

export interface ActivoFormData {
  activo: BackendAsset | null;
  miembros: BackendUser[];
  idUsuarioActual: number | null;
}

@Component({
  selector: 'app-activo-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ModalShellComponent],
  templateUrl: './activo-form.component.html',
})
export class ActivoFormComponent {
  private readonly dialogRef = inject(MatDialogRef<ActivoFormComponent, CrearActivoPayload>);
  private readonly data = inject<ActivoFormData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder).nonNullable;

  private readonly activo = () => this.data.activo;
  readonly esEdicion = this.activo() !== null;
  readonly miembros = this.data.miembros;
  readonly getErrorMessage = getErrorMessage;
  readonly icon = ASSET_ICON;
  readonly titulo = this.esEdicion
    ? $localize`:@@ingresos.activo.tituloEditar:Editar activo`
    : $localize`:@@ingresos.activo.tituloCrear:Registrar activo`;

  readonly form: FormGroup<ActivoFormControls> = this.fb.group({
    idUser: this.fb.control<number | null>(
      this.activo()?.id_user ?? this.data.idUsuarioActual,
      Validators.required,
    ),
    name: this.fb.control(this.activo()?.name ?? '', [
      Validators.required,
      Validators.maxLength(150),
    ]),
    value: this.fb.control<number | null>(this.valorInicial(), [
      Validators.required,
      Validators.min(0),
    ]),
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { idUser, name, value } = this.form.getRawValue();
    this.dialogRef.close({
      idUser: idUser as number,
      name,
      value: value as number,
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private valorInicial(): number | null {
    const activo = this.activo();
    return activo ? Number(activo.value) : null;
  }
}
