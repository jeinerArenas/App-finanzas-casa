import { FormControl } from '@angular/forms';

export interface DeudaFormControls {
  description: FormControl<string>;
  totalAmount: FormControl<number | null>;
  numberOfInstallments: FormControl<number | null>;
  installmentValue: FormControl<number | null>;
  startDate: FormControl<string>;
  estimatedEndDate: FormControl<string>;
  idCategoryType: FormControl<number | null>;
}
