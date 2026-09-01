import { AbstractControl } from '@angular/forms';

const MENSAJES_POR_ERROR: Record<string, (label: string, params?: Record<string, unknown>) => string> = {
  required: (label) => `${label} es obligatorio.`,
  email: () => 'Ingresa un correo válido.',
  pattern: (label) => `${label} tiene un formato inválido.`,
  minlength: (label, params) => `${label} debe tener al menos ${params?.['requiredLength']} caracteres.`,
  min: (label, params) => `${label} debe ser mayor a ${params?.['min']}.`,
  integer: (label) => `${label} debe ser un número entero.`,
  contrasenasNoCoinciden: () => 'Las contraseñas no coinciden.',
  familyNameExiste: () => 'Esta familia ya existe.',
  emailExiste: () => 'Ese correo ya está registrado.',
};

export function getErrorMessage(control: AbstractControl | null, label: string): string {
  if (!control?.errors || (!control.touched && !control.dirty)) return '';

  const [errorKey, params] = Object.entries(control.errors)[0] as [string, Record<string, unknown>];
  const builder = MENSAJES_POR_ERROR[errorKey];

  return builder ? builder(label, params) : `${label} es inválido.`;
}
