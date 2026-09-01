import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, NgZone, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { BackendUser, Role, User } from '../../interfaces';

const SESSION_KEY = 'finanzas-session';
const INACTIVITY_MS = 3 * 60 * 1000;
const TOUCH_THROTTLE_MS = 15 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

interface StoredSession {
  token: string;
  user: BackendUser;
  lastActivityAt: number;
}

/**
 * Único dueño del estado de sesión (token + usuario autenticado).
 * Se guarda en localStorage para sobrevivir un refresh, pero si pasan
 * INACTIVITY_MS sin interacción del usuario (mouse/teclado/scroll), se
 * cierra sola. Lo llenan LoginService y RegistroService al llamar al
 * backend; HelperService lee el token para mandarlo en cada request y
 * lo renueva cuando el backend manda uno nuevo.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);

  private readonly _token = signal<string | null>(null);
  private readonly _backendUser = signal<BackendUser | null>(null);

  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTouchAt = 0;

  readonly token = this._token.asReadonly();
  readonly backendUser = this._backendUser.asReadonly();

  // Forma "legacy" que ya consumen topbar/usuarios/expense/income/user services.
  readonly currentUser = computed<User | null>(() => {
    const u = this._backendUser();
    if (!u) return null;
    const role: Role = u.is_admin ? 'admin' : u.id_role === 2 ? 'esposa' : 'hijos';
    return { id: String(u.id_user), name: u.full_name, email: u.email, role };
  });

  readonly isAuthenticated = computed(() => this._backendUser() !== null);
  readonly isAdmin = computed(() => this._backendUser()?.is_admin === true);

  constructor() {
    if (!this.isBrowser) return;
    this.restoreSession();
    this.zone.runOutsideAngular(() => {
      for (const evt of ACTIVITY_EVENTS) {
        this.document.addEventListener(evt, () => this.touchActivity(), { passive: true });
      }
    });
  }

  setSession(user: BackendUser, token: string): void {
    this._backendUser.set(user);
    this._token.set(token);
    this.persist(token, user, Date.now());
    this.restartTimer();
  }

  updateToken(token: string): void {
    this._token.set(token);
    const user = this._backendUser();
    if (user) this.persist(token, user, this.lastTouchAt || Date.now());
  }

  logout(): void {
    this._backendUser.set(null);
    this._token.set(null);
    this.clearTimer();
    if (this.isBrowser) localStorage.removeItem(SESSION_KEY);
  }

  private touchActivity(): void {
    if (!this._backendUser()) return;
    const now = Date.now();
    if (now - this.lastTouchAt < TOUCH_THROTTLE_MS) return;
    this.lastTouchAt = now;

    const token = this._token();
    const user = this._backendUser();
    if (token && user) this.persist(token, user, now);

    this.zone.run(() => this.restartTimer());
  }

  private restartTimer(): void {
    this.clearTimer();
    this.inactivityTimer = setTimeout(() => this.logout(), INACTIVITY_MS);
  }

  private clearTimer(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = null;
  }

  private persist(token: string, user: BackendUser, lastActivityAt: number): void {
    if (!this.isBrowser) return;
    this.lastTouchAt = lastActivityAt;
    const stored: StoredSession = { token, user, lastActivityAt };
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
  }

  private restoreSession(): void {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;

    try {
      const stored = JSON.parse(raw) as StoredSession;
      if (Date.now() - stored.lastActivityAt >= INACTIVITY_MS) {
        localStorage.removeItem(SESSION_KEY);
        return;
      }
      this._backendUser.set(stored.user);
      this._token.set(stored.token);
      this.lastTouchAt = stored.lastActivityAt;
      this.restartTimer();
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }
}
