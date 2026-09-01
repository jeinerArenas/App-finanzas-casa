import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../servicios';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  readonly mobile = input(false);
  readonly open = input(false);
  readonly linkClick = output<void>();

  readonly isAdmin = this.auth.isAdmin;

  get sidebarClass(): string {
    const base = 'flex flex-col py-5 px-[14px] gap-1 bg-[var(--color-surface)]';
    if (!this.mobile()) {
      return `${base} w-[220px] flex-none border-r border-[color:var(--color-divider)]`;
    }
    const translate = this.open() ? 'translate-x-0' : '-translate-x-full';
    return `${base} fixed inset-y-0 left-0 w-[240px] z-40 border-r border-[color:var(--color-divider)] transition-transform duration-200 ease-in-out shadow-[var(--shadow-lg)] ${translate}`;
  }

  onLinkClick(): void {
    this.linkClick.emit();
  }
}
