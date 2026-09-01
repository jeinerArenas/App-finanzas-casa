import { FormControl } from '@angular/forms';

export interface LoginFormControls {
  email: FormControl<string>;
  password: FormControl<string>;
}
