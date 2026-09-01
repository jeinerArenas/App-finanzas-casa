import { FormControl } from '@angular/forms';

export interface GoalFormControls {
  name: FormControl<string>;
  amount: FormControl<number | null>;
}
