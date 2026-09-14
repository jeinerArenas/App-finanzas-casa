import { Injectable, Type, inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

const DESKTOP_QUERY = '(min-width: 1024px)';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(MatDialog);

  open<T, D = unknown, R = unknown>(component: Type<T>, data?: D): MatDialogRef<T, R> {
    return this.dialog.open<T, D, R>(component, {
      data,
      panelClass: 'app-dialog-panel',
      autoFocus: 'first-tabbable',
      ...this.sizeConfig(),
    });
  }

  private sizeConfig(): Pick<MatDialogConfig, 'width' | 'maxWidth' | 'height' | 'maxHeight'> {
    if (!this.isDesktop()) {
      return { width: '94vw', maxWidth: '94vw', maxHeight: '90vh' };
    }
    return { width: '70vw', maxWidth: '70vw', height: '85vh', maxHeight: '85vh' };
  }

  private isDesktop(): boolean {
    return typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches;
  }
}
