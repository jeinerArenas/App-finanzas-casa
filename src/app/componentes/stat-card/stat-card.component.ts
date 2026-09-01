import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatCardVariant = 'income' | 'expense' | 'savings' | 'goal' | 'neutral';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card" [class]="'stat-card-' + variant()">
      <div class="stat-card-icon">
        @switch (variant()) {
          @case ('income') {
            <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
              <path d="M64 176 176 64M176 64H96M176 64v80" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          }
          @case ('expense') {
            <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
              <path d="M64 80 176 192M176 192H96M176 192v-80" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          }
          @case ('goal') {
            <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
              <circle cx="128" cy="128" r="80" stroke="currentColor" stroke-width="16"></circle>
              <circle cx="128" cy="128" r="36" stroke="currentColor" stroke-width="16"></circle>
            </svg>
          }
          @default {
            <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
              <rect x="48" y="140" width="32" height="60" rx="4" fill="currentColor"></rect>
              <rect x="112" y="104" width="32" height="96" rx="4" fill="currentColor"></rect>
              <rect x="176" y="64" width="32" height="136" rx="4" fill="currentColor"></rect>
            </svg>
          }
        }
      </div>
      <div class="stat-card-kicker">{{ kicker() }}</div>
      <div class="stat-card-value">{{ value() }}</div>
    </div>
  `,
})
export class StatCardComponent {
  readonly kicker = input.required<string>();
  readonly value = input.required<string>();
  readonly variant = input<StatCardVariant>('income');
}
