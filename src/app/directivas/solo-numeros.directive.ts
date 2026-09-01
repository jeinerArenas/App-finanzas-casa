import { Directive, HostListener } from '@angular/core';

const TECLAS_PERMITIDAS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

@Directive({
  selector: '[soloNumeros]',
})
export class SoloNumerosDirective {
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || TECLAS_PERMITIDAS.has(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const texto = event.clipboardData?.getData('text') ?? '';
    if (!/^[0-9]*$/.test(texto)) event.preventDefault();
  }
}
