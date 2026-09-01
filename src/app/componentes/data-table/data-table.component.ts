import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatTableModule } from '@angular/material/table';
import { TableAction, TableColumn } from '../../interfaces';

const ACTIONS_COLUMN = '__actions';

@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, NgTemplateOutlet],
  templateUrl: './data-table.component.html',
})
export class DataTableComponent<T extends Record<string, any> = any> {
  private readonly sanitizer = inject(DomSanitizer);

  readonly columns = input.required<TableColumn<T>[]>();
  readonly data = input<T[]>([]);
  readonly actions = input<TableAction<T>[]>([]);
  readonly emptyMessage = input('No hay datos para mostrar.');

  readonly displayedColumns = computed(() => [
    ...this.columns().map((c) => c.field),
    ...(this.actions().length ? [ACTIONS_COLUMN] : []),
  ]);

  readonly actionsColumn = ACTIONS_COLUMN;

  cellValue(row: T, column: TableColumn<T>): string {
    if (column.format) return column.format(row);
    const value = row[column.field];
    return value === null || value === undefined ? '' : String(value);
  }

  cellClass(row: T, column: TableColumn<T>): string {
    return column.cellClass?.(row) ?? '';
  }

  tagClass(row: T, column: TableColumn<T>): string {
    return column.tagClass?.(row) ?? 'tag-neutral';
  }

  alignClass(column: TableColumn<T>): string {
    if (column.align === 'center') return 'text-center';
    if (column.align === 'right') return 'text-right';
    return '';
  }

  visibleActions(row: T): TableAction<T>[] {
    return this.actions().filter((action) => action.show?.(row) ?? true);
  }

  iconHtml(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }
}
