import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { BackendGoal } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private readonly helper = inject(HelperService);

  private readonly _goal = signal<BackendGoal | null>(null);
  readonly goal = this._goal.asReadonly();

  cargar(): void {
    this.helper.get<BackendGoal | null>('goal').subscribe((goal) => this._goal.set(goal));
  }

  set(name: string, amount: number): Observable<BackendGoal> {
    return this.helper
      .put<BackendGoal>('goal', { name: name.trim() || 'Meta de ahorro', amount })
      .pipe(tap((goal) => this._goal.set(goal)));
  }

  clear(): Observable<void> {
    return this.helper.delete<void>('goal').pipe(tap(() => this._goal.set(null)));
  }
}
