import { FormControl } from '@angular/forms';

export interface RegistroFormControls {
  familyName: FormControl<string>;
  fullName: FormControl<string>;
  documentNumber: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}
