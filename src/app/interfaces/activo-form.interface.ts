import { FormControl } from '@angular/forms';

export interface ActivoFormControls {
  idUser: FormControl<number | null>;
  name: FormControl<string>;
  value: FormControl<number | null>;
}
