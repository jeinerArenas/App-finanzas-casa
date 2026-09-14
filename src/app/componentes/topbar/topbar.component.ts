import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService, MonthService, ThemeService } from '../../servicios';

const TITLES: Record<string, string> = {
  '/dashboard': 'Resumen',
  '/movimientos/ingresos': 'Ingresos',
  '/movimientos/gastos': 'Gastos',
  '/categorias': 'Categorías',
  '/usuarios': 'Usuarios',
  '/actividad': 'Actividad',
};

const MONTH_NAV_ROUTES = new Set(['/dashboard', '/movimientos/gastos', '/categorias']);

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  protected readonly month = inject(MonthService);

  readonly isMobile = input(false);
  readonly toggleSidebarClick = output<void>();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly viewTitle = computed(() => TITLES[this.url()] ?? 'Finanzas en casa');
  readonly showMonthNav = computed(() => MONTH_NAV_ROUTES.has(this.url()));

  readonly currentUser = this.auth.currentUser;
  readonly familyName = computed(() => this.auth.backendUser()?.family_name ?? '');
  readonly currentUserInitials = computed(() => {
    const name = this.currentUser()?.name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  });
  readonly currentUserRoleLabel = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' ? 'Administrador' : role === 'esposa' ? 'Esposa/Esposo' : 'Hijo/a';
  });

  readonly userMenuOpen = signal(false);

  readonly isDarkTheme = this.themeService.isDark;
  readonly themeToggleLabel = computed<string>(() =>
    this.isDarkTheme()
      ? $localize`:@@topbar.temaClaro:Cambiar a modo claro`
      : $localize`:@@topbar.temaOscuro:Cambiar a modo oscuro`,
  );

  toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleSidebar(): void {
    this.toggleSidebarClick.emit();
  }

  prevMonth(): void {
    this.month.shift(-1);
  }

  nextMonth(): void {
    this.month.shift(1);
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
