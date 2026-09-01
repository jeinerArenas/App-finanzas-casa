import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AppData, MonthBucket, emptyAppData } from '../interfaces';

const DATA_KEY = 'finanzas-familiares-v1';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly data = signal<AppData>(this.load());

  private load(): AppData {
    if (!this.isBrowser) return emptyAppData();
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (!raw) return emptyAppData();
      const parsed = JSON.parse(raw) as AppData;
      parsed.months ??= {};
      parsed.categories ??= [];
      parsed.budgets ??= {};
      return parsed;
    } catch {
      return emptyAppData();
    }
  }

  private persist(data: AppData): void {
    if (!this.isBrowser) return;
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }

  mutate(fn: (draft: AppData) => void): AppData {
    const draft: AppData = structuredClone(this.data());
    fn(draft);
    this.persist(draft);
    this.data.set(draft);
    return draft;
  }

  ensureMonth(draft: AppData, monthKey: string): MonthBucket {
    if (!draft.months[monthKey]) draft.months[monthKey] = { incomes: [], expenses: [] };
    return draft.months[monthKey];
  }

  monthOf(monthKey: string): MonthBucket {
    return this.data().months[monthKey] ?? { incomes: [], expenses: [] };
  }

  newId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
