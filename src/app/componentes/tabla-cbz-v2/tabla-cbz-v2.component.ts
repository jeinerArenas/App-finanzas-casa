import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  TemplateRef,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  IConfigurationColumnsCBZ,
  ITableCBZ,
  ITableCBZAction,
  IEventsTableCBZ,
  TableCBZData,
  TableCBZRow,
  TableCBZStyle,
} from '../../interfaces';

const BOM = '\uFEFF';
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_SIZE_OPTIONS: number[] = [10, 20, 30, 40];

@Component({
  selector: 'app-tabla-cbz-v2',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './tabla-cbz-v2.component.html',
  styleUrl: './tabla-cbz-v2.component.css',
})
export class TablaCbzV2Component<T extends TableCBZData = TableCBZRow> {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly document = inject(DOCUMENT);

  readonly configuration = input.required<ITableCBZ<T>>();
  readonly events = output<IEventsTableCBZ<T>>();

  readonly pageSize = linkedSignal<number>(
    () => this.configuration().configurationPagination?.pageSize ?? DEFAULT_PAGE_SIZE,
  );

  readonly pageIndex = linkedSignal<{ total: number; size: number }, number>({
    source: () => ({ total: this.configuration().data.length, size: this.pageSize() }),
    computation: () => 0,
  });

  private readonly columnConfig = computed<IConfigurationColumnsCBZ<T> | undefined>(
    () => this.configuration().configurationColumns,
  );

  readonly allColumns = computed<string[]>(() => {
    const explicit = this.columnConfig()?.keys ?? [];
    if (explicit.length > 0) return explicit;
    const [first] = this.configuration().data;
    return first ? Object.keys(first) : [];
  });

  readonly visibleColumns = computed<string[]>(() => {
    const hidden = this.columnConfig()?.hiddensColumns ?? [];
    return this.allColumns().filter((key) => !hidden.includes(key));
  });

  readonly hasActions = computed<boolean>(
    () => (this.configuration().configurationActions?.length ?? 0) > 0,
  );

  readonly columnSpan = computed<number>(
    () => this.visibleColumns().length + (this.hasActions() ? 1 : 0),
  );

  readonly paginationEnabled = computed<boolean>(
    () => this.configuration().configurationPagination?.visible ?? false,
  );

  readonly showPagination = computed<boolean>(
    () => this.paginationEnabled() && this.totalPages() > 1,
  );

  readonly pageSizeOptions = computed<number[]>(
    () =>
      this.configuration().configurationPagination?.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS,
  );

  readonly totalPages = computed<number>(() => {
    const total = this.configuration().data.length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  readonly pagedData = computed<T[]>(() => {
    const rows = this.configuration().data;
    if (!this.paginationEnabled()) return rows;
    const start = this.pageIndex() * this.pageSize();
    return rows.slice(start, start + this.pageSize());
  });

  readonly showExport = computed<boolean>(() => {
    const config = this.configuration().configurationExport;
    if (!config) return false;
    return config.visible ?? true;
  });

  readonly emptyText = computed<string>(
    () =>
      this.configuration().emptyMessage ?? $localize`:@@tablaCbz.empty:No hay datos para mostrar.`,
  );

  headerLabel(key: string): string {
    return this.columnConfig()?.i18n?.[key] ?? key;
  }

  headerClass(key: string): string {
    const extra = this.columnConfig()?.classNameHeader?.[key] ?? [];
    return [this.alignClass(key), ...extra].filter(Boolean).join(' ');
  }

  headerStyle(key: string): TableCBZStyle {
    return this.columnConfig()?.styleHeader?.[key] ?? {};
  }

  alignClass(key: string): string {
    const align = this.columnConfig()?.align?.[key];
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return '';
  }

  isLeft(key: string): boolean {
    return (this.columnConfig()?.leftedColumns ?? []).includes(key);
  }

  isTag(key: string): boolean {
    return (this.columnConfig()?.tagColumns ?? []).includes(key);
  }

  cellTemplate(key: string): TemplateRef<{ $implicit: T }> | null {
    return this.columnConfig()?.cellTemplates?.[key] ?? null;
  }

  cellText(row: T, key: string): string {
    const formatter = this.columnConfig()?.format?.[key];
    if (formatter) return formatter(row);
    const value = this.fieldValue(row, key);
    if (value === null || value === undefined) return '';
    return String(value);
  }

  cellStyle(row: T, key: string): TableCBZStyle {
    const base = this.columnConfig()?.style?.[key] ?? {};
    const dynamic = this.columnConfig()?.styleCell?.[key];
    if (!dynamic) return base;
    return { ...base, ...dynamic(row) };
  }

  tagClass(row: T, key: string): string {
    return this.columnConfig()?.tagClass?.[key]?.(row) ?? 'tag-neutral';
  }

  rowStyle(row: T): TableCBZStyle {
    return this.configuration().configurationRows?.style?.(row) ?? {};
  }

  rowKey(row: T, index: number): string {
    const keyColumn = this.configuration().configurationRows?.keyColumn;
    if (!keyColumn) return String(index);
    return String(this.fieldValue(row, keyColumn));
  }

  private fieldValue(row: T, key: string): unknown {
    return (row as TableCBZRow)[key];
  }

  visibleActions(row: T): ITableCBZAction<T>[] {
    const actions = this.configuration().configurationActions ?? [];
    return actions.filter((action) => action.show?.(row) ?? true);
  }

  isActionDisabled(action: ITableCBZAction<T>, row: T): boolean {
    return action.disabled?.(row) ?? false;
  }

  iconHtml(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }

  onAction(action: ITableCBZAction<T>, row: T, event: Event): void {
    event.stopPropagation();
    this.events.emit({ type: 'actionClick', action: action.id, row });
  }

  onRowClick(row: T): void {
    this.events.emit({ type: 'rowClick', row });
  }

  prevPage(): void {
    this.goToPage(this.pageIndex() - 1);
  }

  nextPage(): void {
    this.goToPage(this.pageIndex() + 1);
  }

  changePageSize(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.pageIndex.set(0);
    this.emitPageChange();
  }

  exportData(): void {
    const keys = this.exportColumns();
    const rows = this.configuration().data;
    const fileName = this.configuration().configurationExport?.fileName ?? 'export';
    this.downloadCsv(this.toCsv(keys, rows), fileName);
    this.events.emit({ type: 'exportClick', rows });
  }

  private goToPage(index: number): void {
    const clamped = Math.min(Math.max(index, 0), this.totalPages() - 1);
    this.pageIndex.set(clamped);
    this.emitPageChange();
  }

  private emitPageChange(): void {
    this.events.emit({
      type: 'pageChange',
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
    });
  }

  private exportColumns(): string[] {
    if (this.configuration().configurationExport?.includeHiddenColumns) return this.allColumns();
    return this.visibleColumns();
  }

  private toCsv(keys: string[], rows: T[]): string {
    const header = keys.map((key) => this.escapeCsv(this.headerLabel(key))).join(',');
    const lines = rows.map((row) =>
      keys.map((key) => this.escapeCsv(this.cellText(row, key))).join(','),
    );
    return [header, ...lines].join('\r\n');
  }

  private escapeCsv(value: string): string {
    if (!/[",\r\n]/.test(value)) return value;
    return `"${value.replace(/"/g, '""')}"`;
  }

  private downloadCsv(content: string, fileName: string): void {
    const name = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
