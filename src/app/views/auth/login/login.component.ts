import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../../servicios';
import { LoginFormControls } from '../../../interfaces';
import { getErrorMessage } from '../../../utils/form-errors';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly form: FormGroup<LoginFormControls> = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required]),
  });

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
    const { email, password } = this.form.getRawValue();

    this.loginService.login(email, password).subscribe({
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
