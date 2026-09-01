import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, map, of, switchMap, timer } from 'rxjs';

const DEBOUNCE_MS = 400;

export function existenciaAsyncValidator(
  verificar: (valor: string) => Observable<boolean>,
  errorKey: string,
): AsyncValidatorFn {
  return (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
    if (!control.value) return of(null);

    return timer(DEBOUNCE_MS).pipe(
      switchMap(() => verificar(control.value)),
      map((existe) => (existe ? { [errorKey]: true } : null)),
    );
  };
}
