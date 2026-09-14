import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  BackendRole,
  BackendUser,
  CrearUsuarioPayload,
  UsuarioFormControls,
} from '../../../interfaces';
import { getErrorMessage } from '../../../utils/form-errors';
import { SoloNumerosDirective, SoloTextoDirective } from '../../../directivas';
import { ModalShellComponent } from '../../../componentes/modal/modal-shell.component';
import { USER_ICON } from '../../../utils/icons';

const PATRON_TEXTO = /^[a-zA-ZÀ-ÿ\s]+$/;
const PATRON_NUMERICO = /^[0-9]+$/;

export interface UsuarioFormData {
  roles: BackendRole[];
  usuario: BackendUser | null;
}

@Component({
  selector: 'app-usuario-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SoloNumerosDirective, SoloTextoDirective, ModalShellComponent],
  templateUrl: './usuario-form.component.html',
})
export class UsuarioFormComponent {
  private readonly dialogRef = inject(MatDialogRef<UsuarioFormComponent, CrearUsuarioPayload>);
  private readonly data = inject<UsuarioFormData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder).nonNullable;

  readonly roles = this.data.roles;
  private readonly usuario = () => this.data.usuario;
  readonly esEdicion = this.usuario() !== null;
  readonly icon = USER_ICON;
  readonly titulo = this.esEdicion
    ? $localize`:@@usuarios.form.tituloEditar:Editar usuario`
    : $localize`:@@usuarios.form.tituloCrear:Agregar nuevo usuario`;

  readonly form: FormGroup<UsuarioFormControls> = this.fb.group({
    documentNumber: this.fb.control(this.usuario()?.document_number ?? '', [
      Validators.required,
      Validators.pattern(PATRON_NUMERICO),
    ]),
    fullName: this.fb.control(this.usuario()?.full_name ?? '', [
      Validators.required,
      Validators.pattern(PATRON_TEXTO),
    ]),
    email: this.fb.control(this.usuario()?.email ?? '', [Validators.required, Validators.email]),
    idRole: this.fb.control<number | null>(this.usuario()?.id_role ?? null, [Validators.required]),
  });

  readonly getErrorMessage = getErrorMessage;

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { documentNumber, fullName, email, idRole } = this.form.getRawValue();
    this.dialogRef.close({ documentNumber, fullName, email, idRole: idRole as number });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
