import { Injectable, computed, signal } from '@angular/core';

function keyFor(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Mes seleccionado, compartido entre Topbar, Dashboard y Movimientos. */
@Injectable({ providedIn: 'root' })
export class MonthService {
  readonly monthKey = signal(keyFor(new Date()));

  readonly monthLabel = computed(() => this.labelFor(this.monthKey()));

  labelFor(key: string): string {
    const [y, m] = key.split('-').map(Number);
    const s = new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  shift(delta: number): void {
    const [y, m] = this.monthKey().split('-').map(Number);
    const dt = new Date(y, m - 1 + delta, 1);
    this.monthKey.set(keyFor(dt));
  }
}
