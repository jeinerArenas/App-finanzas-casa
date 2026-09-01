import { Injectable, Type, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

const WIDTH_BY_SIZE: Record<ModalSize, string> = {
  sm: '360px',
  md: '480px',
  lg: '640px',
  full: '95vw',
};

/**
 * Único punto para abrir modales (MatDialog) en toda la app. Centraliza el
 * ancho por tamaño y el panelClass que anula el fondo/padding por defecto de
 * Material, para que el `.card` del componente de contenido sea la superficie
 * visible (mismo look que el resto de la app, ver .app-dialog-panel en
 * design-system.css).
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(MatDialog);

  open<T, D = unknown, R = unknown>(component: Type<T>, data?: D, size: ModalSize = 'md'): MatDialogRef<T, R> {
    return this.dialog.open<T, D, R>(component, {
      data,
      width: WIDTH_BY_SIZE[size],
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'app-dialog-panel',
      autoFocus: 'first-tabbable',
    });
  }
}
