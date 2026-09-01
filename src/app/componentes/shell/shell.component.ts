import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private mediaQuery?: MediaQueryList;
  private mediaQueryHandler = (e: MediaQueryListEvent) => {
    this.isMobile.set(e.matches);
    if (!e.matches) this.sidebarOpen.set(false);
  };

  readonly isMobile = signal(this.isBrowser && typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false);
  readonly sidebarOpen = signal(false);

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.mediaQuery = window.matchMedia('(max-width: 640px)');
    this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener('change', this.mediaQueryHandler);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
