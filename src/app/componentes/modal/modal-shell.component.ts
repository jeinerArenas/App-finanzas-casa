import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './modal-shell.component.html',
})
export class ModalShellComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly close = output<void>();

  iconHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.icon());
  }
}
