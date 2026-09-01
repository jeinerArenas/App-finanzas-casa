import { FormControl } from '@angular/forms';

export interface UsuarioFormControls {
  documentNumber: FormControl<string>;
  fullName: FormControl<string>;
  email: FormControl<string>;
  idRole: FormControl<number | null>;
}
