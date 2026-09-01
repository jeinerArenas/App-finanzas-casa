import { Injectable, computed, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StorageService } from './storage.service';
import { MonthService } from './month.service';
import { CategoryStat, DEFAULT_CATEGORIES } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly storage = inject(StorageService);
  private readonly month = inject(MonthService);

  readonly categories = computed(() => [...DEFAULT_CATEGORIES, ...this.storage.data().categories]);

  /** Estadísticas del mes actualmente seleccionado (topbar), reactivas. */
  readonly currentMonthStats = computed(() => this.statsFor(this.month.monthKey()));

  readonly overBudgetCategories = computed(() => this.currentMonthStats().filter((c) => c.over));

  private statsFor(monthKey: string): CategoryStat[] {
    const bucket = this.storage.monthOf(monthKey);
    const budgets = this.storage.data().budgets;
    return this.categories().map((name) => {
      const spent = bucket.expenses.filter((e) => e.category === name).reduce((s, e) => s + e.amount, 0);
      const budget = budgets[name] || 0;
      return { name, spent, budget, over: budget > 0 && spent > budget };
    });
  }

  statsForMonth(monthKey: string): Observable<CategoryStat[]> {
    return of(this.statsFor(monthKey));
  }

  add(name: string): Observable<void> {
    const clean = name.trim();
    if (!clean) return of(void 0);
    this.storage.mutate((draft) => {
      if (!draft.categories.includes(clean)) draft.categories.push(clean);
    });
    return of(void 0);
  }

  updateBudget(name: string, value: number): Observable<void> {
    this.storage.mutate((draft) => {
      draft.budgets[name] = value || 0;
    });
    return of(void 0);
  }
}
