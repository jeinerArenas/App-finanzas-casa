import { FormControl } from '@angular/forms';

export interface SalarioFormControls {
  idUser: FormControl<number | null>;
  amount: FormControl<number | null>;
  startDate: FormControl<string>;
  variableAmount: FormControl<number | null>;
  variableDescription: FormControl<string>;
}
