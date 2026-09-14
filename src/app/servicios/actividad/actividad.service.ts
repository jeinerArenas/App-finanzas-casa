import { Injectable, inject, signal } from '@angular/core';
import { HelperService } from '../helper/helper.service';
import { BackendActivityLog, LogAction } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly helper = inject(HelperService);

  private readonly _logs = signal<BackendActivityLog[]>([]);
  readonly logs = this._logs.asReadonly();

  cargar(): void {
    this.helper
      .get<BackendActivityLog[]>('activity-logs')
      .subscribe((logs) => this._logs.set(logs));
  }

  registrar(action: LogAction, detail: string): void {
    this.helper
      .post('activity-logs', { action, detail })
      .subscribe({ next: () => {}, error: () => {} });
  }
}
