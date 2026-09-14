import { FormControl } from '@angular/forms';

export interface CategoriaFormControls {
  categoryName: FormControl<string>;
  idCategoryType: FormControl<number | null>;
  monthlyBudget: FormControl<number | null>;
}
