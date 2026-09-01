import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegistroService } from '../../../servicios';
import { RegistroFormControls } from '../../../interfaces';
import { getErrorMessage } from '../../../utils/form-errors';
import { contrasenasCoincidenValidator, existenciaAsyncValidator } from '../../../validadores';
import { SoloNumerosDirective, SoloTextoDirective } from '../../../directivas';

const PATRON_TEXTO = /^[a-zA-ZÀ-ÿ\s]+$/;
const PATRON_NUMERICO = /^[0-9]+$/;

@Component({
  selector: 'app-registro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, SoloNumerosDirective, SoloTextoDirective],
  templateUrl: './registro.component.html',
})
export class RegistroComponent {
  private readonly registroService = inject(RegistroService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly form: FormGroup<RegistroFormControls> = this.fb.group(
    {
      familyName: this.fb.control('', {
        validators: [Validators.required, Validators.pattern(PATRON_TEXTO)],
        asyncValidators: [
          existenciaAsyncValidator((valor) => this.registroService.familyNameExists(valor), 'familyNameExiste'),
        ],
      }),
      fullName: this.fb.control('', [Validators.required, Validators.pattern(PATRON_TEXTO)]),
      documentNumber: this.fb.control('', [Validators.required, Validators.pattern(PATRON_NUMERICO)]),
      email: this.fb.control('', {
        validators: [Validators.required, Validators.email],
        asyncValidators: [
          existenciaAsyncValidator((valor) => this.registroService.emailExists(valor), 'emailExiste'),
        ],
      }),
      password: this.fb.control('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: this.fb.control('', [Validators.required]),
    },
    { validators: contrasenasCoincidenValidator('password', 'confirmPassword') },
  );

  readonly error = signal('');
  readonly loading = signal(false);
  readonly getErrorMessage = getErrorMessage;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.loading.set(true);
    const { familyName, fullName, documentNumber, email, password } = this.form.getRawValue();

    this.registroService.registrar({ familyName, fullName, documentNumber, email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }
}
