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
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  IConfigurationColumnsCBZ,
  IConfigurationToolbarActionCBZ,
  ITableCBZ,
  ITableCBZAction,
  IEventsTableCBZ,
  TableCBZActionVariant,
  TableCBZData,
  TableCBZRow,
  TableCBZStyle,
  TableCBZSortDir,
  TableCBZSortState,
} from '../../interfaces';
import {
  CHEVRON_LEFT_ICON,
  CHEVRON_RIGHT_ICON,
  EXPORT_ICON,
  FIRST_PAGE_ICON,
  LAST_PAGE_ICON,
  SEARCH_ICON,
  SORT_FUNNEL_ICON,
} from '../../utils/icons';

const BOM = '\uFEFF';
const DEFAULT_PAGE_SIZE = 6;
const DEFAULT_PAGE_SIZE_OPTIONS: number[] = [6, 10, 20, 30, 40];

@Component({
  selector: 'app-tabla-cbz-v2',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './tabla-cbz-v2.component.html',
})
export class TablaCbzV2Component<T extends TableCBZData = TableCBZRow> {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly document = inject(DOCUMENT);

  readonly configuration = input.required<ITableCBZ<T>>();
  readonly events = output<IEventsTableCBZ<T>>();

  readonly searchIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(SEARCH_ICON);
  readonly sortIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(SORT_FUNNEL_ICON);
  readonly exportIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(EXPORT_ICON);
  readonly firstPageIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(FIRST_PAGE_ICON);
  readonly prevPageIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(CHEVRON_LEFT_ICON);
  readonly nextPageIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(CHEVRON_RIGHT_ICON);
  readonly lastPageIconHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(LAST_PAGE_ICON);

  readonly searchTerm = signal<string>('');
  readonly sortState = signal<TableCBZSortState | null>(null);
  readonly toolbarChecked = signal<Record<string, boolean>>({});

  readonly toolbarButtonClasses: string =
    'inline-flex items-center justify-center w-[34px] h-[34px] rounded-lg border border-[var(--color-divider)] bg-[var(--color-bg)] text-[color-mix(in_srgb,var(--color-text)_55%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40 disabled:pointer-events-none [&>svg]:block';

  readonly pagerNavButtonClasses: string =
    'inline-flex items-center justify-center w-[34px] h-[34px] rounded-lg text-[color-mix(in_srgb,var(--color-text)_60%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] disabled:opacity-40 disabled:pointer-events-none [&>svg]:block';

  private readonly actionBaseClasses: string =
    'inline-flex items-center justify-center w-[30px] h-[30px] rounded-lg transition-colors text-[color-mix(in_srgb,var(--color-text)_45%,transparent)] disabled:opacity-40 disabled:pointer-events-none [&>svg]:block';

  private readonly actionVariantClasses: Record<TableCBZActionVariant | 'neutral', string> = {
    neutral:
      'hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)]',
    view: 'hover:text-[#2563eb] hover:bg-[color-mix(in_srgb,#2563eb_14%,transparent)]',
    edit: 'hover:text-[#d97706] hover:bg-[color-mix(in_srgb,#d97706_14%,transparent)]',
    danger: 'hover:text-[#dc2626] hover:bg-[color-mix(in_srgb,#dc2626_14%,transparent)]',
    success: 'hover:text-[#16a34a] hover:bg-[color-mix(in_srgb,#16a34a_14%,transparent)]',
    info: 'hover:text-[#0d9488] hover:bg-[color-mix(in_srgb,#0d9488_14%,transparent)]',
  };

  readonly pageSize = linkedSignal<number>(
    () => this.configuration().configurationPagination?.pageSize ?? DEFAULT_PAGE_SIZE,
  );

  readonly pageIndex = linkedSignal<{ total: number; size: number }, number>({
    source: () => ({ total: this.sortedData().length, size: this.pageSize() }),
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

  readonly searchVisible = computed<boolean>(
    () => this.configuration().configurationSearch?.visible ?? true,
  );

  readonly searchPlaceholder = computed<string>(
    () =>
      this.configuration().configurationSearch?.placeholder ??
      $localize`:@@tablaCbz.searchPlaceholder:Buscar`,
  );

  private readonly searchKeys = computed<string[]>(
    () => this.configuration().configurationSearch?.keys ?? this.visibleColumns(),
  );

  readonly sortableColumns = computed<string[]>(
    () => this.columnConfig()?.sortableColumns ?? this.visibleColumns(),
  );

  readonly visibleToolbarActions = computed<IConfigurationToolbarActionCBZ[]>(() => {
    const actions = this.configuration().configurationToolbarActions ?? [];
    return actions.filter((action) => action.show?.() ?? true);
  });

  readonly filteredData = computed<T[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const rows = this.configuration().data;
    if (!term) return rows;
    const keys = this.searchKeys();
    return rows.filter((row) =>
      keys.some((key) => this.cellText(row, key).toLowerCase().includes(term)),
    );
  });

  readonly sortedData = computed<T[]>(() => {
    const state = this.sortState();
    const rows = this.filteredData();
    if (!state) return rows;
    return this.applySort(rows, state);
  });

  readonly hasActions = computed<boolean>(
    () => (this.configuration().configurationActions?.length ?? 0) > 0,
  );

  readonly columnSpan = computed<number>(
    () => this.visibleColumns().length + (this.hasActions() ? 1 : 0),
  );

  readonly paginationEnabled = computed<boolean>(
    () => this.configuration().configurationPagination?.visible ?? true,
  );

  readonly showPagination = computed<boolean>(
    () => this.paginationEnabled() && this.totalPages() > 1,
  );

  readonly pageSizeOptions = computed<number[]>(
    () =>
      this.configuration().configurationPagination?.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS,
  );

  readonly totalPages = computed<number>(() => {
    const total = this.sortedData().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  readonly totalRows = computed<number>(() => this.sortedData().length);

  readonly rangeStart = computed<number>(() => {
    if (this.totalRows() === 0) return 0;
    return this.pageIndex() * this.pageSize() + 1;
  });

  readonly rangeEnd = computed<number>(() =>
    Math.min((this.pageIndex() + 1) * this.pageSize(), this.totalRows()),
  );

  readonly pagedData = computed<T[]>(() => {
    const rows = this.sortedData();
    if (!this.paginationEnabled()) return rows;
    const start = this.pageIndex() * this.pageSize();
    return rows.slice(start, start + this.pageSize());
  });

  readonly showExport = computed<boolean>(() => {
    const config = this.configuration().configurationExport;
    if (!config) return false;
    return config.visible ?? true;
  });

  readonly exportLabel = computed<string>(() => $localize`:@@tablaCbz.export:Exportar`);

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

  headerClasses(key: string): string {
    const interactive = this.isSortable(key) ? 'cursor-pointer select-none group' : '';
    return [this.headerClass(key), this.headerStickyClasses(key), interactive]
      .filter(Boolean)
      .join(' ');
  }

  cellClasses(key: string): string {
    return [this.alignClass(key), this.cellStickyClasses(key)].filter(Boolean).join(' ');
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

  headerStickyClasses(key: string): string {
    const sticky = this.configuration().stickyHeader ?? false;
    const left = this.isLeft(key);
    if (sticky && left) return 'sticky top-0 left-0 z-30 bg-[var(--color-bg)]';
    if (sticky) return 'sticky top-0 z-20 bg-[var(--color-bg)]';
    if (left) return 'sticky left-0 z-10 bg-[var(--color-surface)]';
    return '';
  }

  cellStickyClasses(key: string): string {
    return this.isLeft(key) ? 'sticky left-0 z-10 bg-[var(--color-surface)]' : '';
  }

  isSortable(key: string): boolean {
    return this.sortableColumns().includes(key);
  }

  sortDirFor(key: string): TableCBZSortDir | null {
    const state = this.sortState();
    return state?.key === key ? state.dir : null;
  }

  sortIconClasses(key: string): string {
    const base = 'inline-flex transition-all duration-150 [&>svg]:block';
    const dir = this.sortDirFor(key);
    if (dir === 'asc') return `${base} opacity-100 text-[var(--color-accent)]`;
    if (dir === 'desc') return `${base} opacity-100 text-[var(--color-accent)] rotate-180`;
    return `${base} opacity-35 group-hover:opacity-70`;
  }

  toggleSort(key: string): void {
    if (!this.isSortable(key)) return;
    const nextDir = this.nextSortDir(key);
    this.sortState.set(nextDir ? { key, dir: nextDir } : null);
    this.pageIndex.set(0);
    this.events.emit({
      type: 'sortChange',
      action: key,
      sortState: nextDir ? { key, dir: nextDir } : null,
    });
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

  actionButtonClasses(action: ITableCBZAction<T>): string {
    return `${this.actionBaseClasses} ${this.actionVariantClasses[action.variant ?? 'neutral']}`;
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

  isToolbarChecked(action: IConfigurationToolbarActionCBZ): boolean {
    return this.toolbarChecked()[action.id] ?? action.checked ?? false;
  }

  onToolbarButtonClick(action: IConfigurationToolbarActionCBZ): void {
    if (action.disabled) return;
    this.events.emit({ type: 'toolbarActionClick', action: action.id });
  }

  onToolbarCheckboxChange(action: IConfigurationToolbarActionCBZ, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toolbarChecked.update((state) => ({ ...state, [action.id]: target.checked }));
    this.events.emit({ type: 'toolbarActionClick', action: action.id, checked: target.checked });
  }

  goToFirstPage(): void {
    this.goToPage(0);
  }

  prevPage(): void {
    this.goToPage(this.pageIndex() - 1);
  }

  nextPage(): void {
    this.goToPage(this.pageIndex() + 1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages() - 1);
  }

  changePageSize(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.pageIndex.set(0);
    this.emitPageChange();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.pageIndex.set(0);
    this.events.emit({ type: 'searchChange', searchTerm: target.value });
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

  private nextSortDir(key: string): TableCBZSortDir | null {
    const current = this.sortState();
    if (current?.key !== key) return 'asc';
    if (current.dir === 'asc') return 'desc';
    return null;
  }

  private applySort(rows: T[], state: TableCBZSortState): T[] {
    const factor = state.dir === 'asc' ? 1 : -1;
    return [...rows].sort(
      (a, b) =>
        this.cellText(a, state.key).localeCompare(this.cellText(b, state.key), undefined, {
          numeric: true,
        }) * factor,
    );
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
