import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function contrasenasCoincidenValidator(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirmPassword = group.get(confirmKey)?.value;
    const coinciden = !password || !confirmPassword || password === confirmPassword;

    return coinciden ? null : { contrasenasNoCoinciden: true };
  };
}
