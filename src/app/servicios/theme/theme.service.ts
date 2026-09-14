import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Theme } from '../../interfaces';

const THEME_KEY = 'finanzas-theme';
const LIGHT_PREFERENCE_QUERY = '(prefers-color-scheme: light)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly document = inject(DOCUMENT);

  private readonly _theme = signal<Theme>(this.resolveInitialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    this.applyTheme(this._theme());
  }

  toggle(): void {
    this.setTheme(this._theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    this.applyTheme(theme);
    this.persistTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) return;
    this.document.documentElement.setAttribute('data-theme', theme);
  }

  private persistTheme(theme: Theme): void {
    if (!this.isBrowser) return;
    localStorage.setItem(THEME_KEY, theme);
  }

  private resolveInitialTheme(): Theme {
    if (!this.isBrowser) return 'dark';
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia(LIGHT_PREFERENCE_QUERY).matches ? 'light' : 'dark';
  }
}
