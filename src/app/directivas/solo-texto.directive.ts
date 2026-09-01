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

const PATRON_TEXTO = /^[a-zA-ZÀ-ÿ\s]$/;

@Directive({
  selector: '[soloTexto]',
})
export class SoloTextoDirective {
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || TECLAS_PERMITIDAS.has(event.key)) return;
    if (!PATRON_TEXTO.test(event.key)) event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const texto = event.clipboardData?.getData('text') ?? '';
    if (!/^[a-zA-ZÀ-ÿ\s]*$/.test(texto)) event.preventDefault();
  }
}
