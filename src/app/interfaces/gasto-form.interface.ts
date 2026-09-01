import { FormControl } from '@angular/forms';

export interface GastoFormControls {
  idCategory: FormControl<number | null>;
  amount: FormControl<number | null>;
  expenseDate: FormControl<string>;
  note: FormControl<string>;
  idUser: FormControl<number | null>;
  idDebt: FormControl<number | null>;
  installmentsCount: FormControl<number | null>;
}
