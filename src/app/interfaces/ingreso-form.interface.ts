import { FormControl } from '@angular/forms';

export interface IngresoFormControls {
  concept: FormControl<string>;
  amount: FormControl<number | null>;
  idUser: FormControl<number | null>;
  incomeDate: FormControl<string>;
}
