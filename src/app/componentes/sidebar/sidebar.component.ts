import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../servicios';
import {
  CATEGORY_ICON,
  DEBT_ICON,
  EXPENSE_LIST_ICON,
  INCOME_ICON,
  USER_ICON,
} from '../../utils/icons';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly mobile = input(false);
  readonly open = input(false);
  readonly linkClick = output<void>();

  readonly isAdmin = this.auth.isAdmin;

  readonly debtIcon = this.trust(DEBT_ICON);
  readonly userIcon = this.trust(USER_ICON);
  readonly categoryIcon = this.trust(CATEGORY_ICON);
  readonly incomeIcon = this.trust(INCOME_ICON);
  readonly expenseIcon = this.trust(EXPENSE_LIST_ICON);

  readonly movimientosOpen = signal(true);

  get sidebarClass(): string {
    const base = 'flex flex-col py-5 px-[14px] gap-1 bg-[var(--color-surface)]';
    if (!this.mobile()) {
      return `${base} w-[220px] flex-none border-r border-[color:var(--color-divider)]`;
    }
    const translate = this.open() ? 'translate-x-0' : '-translate-x-full';
    return `${base} fixed inset-y-0 left-0 w-[240px] z-40 border-r border-[color:var(--color-divider)] transition-transform duration-200 ease-in-out shadow-[var(--shadow-lg)] ${translate}`;
  }

  toggleMovimientos(): void {
    this.movimientosOpen.update((v) => !v);
  }

  onLinkClick(): void {
    this.linkClick.emit();
  }

  private trust(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }
}
