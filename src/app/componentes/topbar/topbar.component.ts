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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import {
  AuthService,
  CategoriasService,
  DeudasService,
  GastosService,
  IngresosService,
  MonthService,
  ThemeService,
  UsuariosService,
} from '../../servicios';
import { ModalService } from '../modal/modal.service';
import type { GastoFormComponent, GastoFormData } from '../../views/gastos/gasto-form/gasto-form.component';
import type { DeudaFormComponent } from '../../views/deudas/deuda-form/deuda-form.component';
import type {
  IngresoFormComponent,
  IngresoFormData,
} from '../../views/ingresos/ingreso-form/ingreso-form.component';
import type { CategoriaFormComponent } from '../../views/categorias/categoria-form/categoria-form.component';
import {
  BackendCategory,
  BackendDebt,
  BackendUser,
  CrearCategoriaPayload,
  CrearDeudaPayload,
  CrearGastoPayload,
  CrearIngresoPayload,
} from '../../interfaces';
import {
  CATEGORY_ICON,
  DEBT_ICON,
  INCOME_ICON,
  QUICK_ACTIONS_ICON,
  RECEIPT_ICON,
} from '../../utils/icons';

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
  private readonly modal = inject(ModalService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly categoriasService = inject(CategoriasService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly deudasService = inject(DeudasService);
  private readonly gastosService = inject(GastosService);
  private readonly ingresosService = inject(IngresosService);
  protected readonly month = inject(MonthService);

  readonly isMobile = input(false);
  readonly toggleSidebarClick = output<void>();

  readonly quickActionsIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
    QUICK_ACTIONS_ICON,
  );
  readonly gastoIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(RECEIPT_ICON);
  readonly deudaIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(DEBT_ICON);
  readonly ingresoIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(INCOME_ICON);
  readonly categoriaIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(CATEGORY_ICON);

  readonly quickMenuOpen = signal(false);
  readonly quickActionError = signal('');
  private readonly categorias = signal<BackendCategory[]>([]);
  private readonly miembros = signal<BackendUser[]>([]);
  private readonly deudasActivas = computed<BackendDebt[]>(() =>
    this.deudasService.deudas().filter((d) => Number(d.pending_balance) > 0),
  );

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

  private quickActionsDataLoaded = false;

  toggleUserMenu(): void {
    this.quickMenuOpen.set(false);
    this.userMenuOpen.update((v) => !v);
  }

  toggleQuickMenu(): void {
    this.userMenuOpen.set(false);
    this.quickActionError.set('');
    this.quickMenuOpen.update((v) => !v);
    if (this.quickMenuOpen()) this.loadQuickActionsData();
  }

  async abrirRegistrarGasto(): Promise<void> {
    this.quickMenuOpen.set(false);
    const { GastoFormComponent } = await import(
      '../../views/gastos/gasto-form/gasto-form.component'
    );
    this.modal
      .open<GastoFormComponent, GastoFormData, CrearGastoPayload>(GastoFormComponent, {
        gasto: null,
        categorias: this.categorias(),
        miembros: this.miembros(),
        deudasActivas: this.deudasActivas(),
        idUsuarioActual: this.auth.backendUser()?.id_user ?? null,
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        this.gastosService.crear(payload).subscribe({
          next: () => {
            if (payload.idDebt) this.deudasService.cargar();
          },
          error: (err: Error) => this.quickActionError.set(err.message),
        });
      });
  }

  async abrirRegistrarDeuda(): Promise<void> {
    this.quickMenuOpen.set(false);
    const { DeudaFormComponent } = await import(
      '../../views/deudas/deuda-form/deuda-form.component'
    );
    this.modal
      .open<DeudaFormComponent, { deuda: null }, CrearDeudaPayload>(DeudaFormComponent, {
        deuda: null,
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        this.deudasService.crear(payload).subscribe({
          error: (err: Error) => this.quickActionError.set(err.message),
        });
      });
  }

  async abrirRegistrarIngreso(): Promise<void> {
    this.quickMenuOpen.set(false);
    const { IngresoFormComponent } = await import(
      '../../views/ingresos/ingreso-form/ingreso-form.component'
    );
    this.modal
      .open<IngresoFormComponent, IngresoFormData, CrearIngresoPayload>(IngresoFormComponent, {
        ingreso: null,
        miembros: this.miembros(),
        idUsuarioActual: this.auth.backendUser()?.id_user ?? null,
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        this.ingresosService.crear(payload).subscribe({
          error: (err: Error) => this.quickActionError.set(err.message),
        });
      });
  }

  async abrirRegistrarCategoria(): Promise<void> {
    this.quickMenuOpen.set(false);
    const { CategoriaFormComponent } = await import(
      '../../views/categorias/categoria-form/categoria-form.component'
    );
    this.modal
      .open<CategoriaFormComponent, { categoria: null }, CrearCategoriaPayload>(
        CategoriaFormComponent,
        { categoria: null },
      )
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        this.categoriasService.crear(payload).subscribe({
          error: (err: Error) => this.quickActionError.set(err.message),
        });
      });
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

  private loadQuickActionsData(): void {
    if (this.quickActionsDataLoaded) return;
    this.quickActionsDataLoaded = true;
    this.categoriasService.listar().subscribe((categorias) => this.categorias.set(categorias));
    this.usuariosService.listar().subscribe((miembros) => this.miembros.set(miembros));
    this.deudasService.cargar();
  }
}
