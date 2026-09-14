import { TemplateRef } from '@angular/core';

export type TableCBZRow = Record<string, unknown>;

export type TableCBZData = object;

export type TableCBZAlign = 'left' | 'center' | 'right';

export type TableCBZStyle = Record<string, string>;

export type TableCBZEventType = 'actionClick' | 'exportClick' | 'pageChange' | 'rowClick';

export type TableCBZFormatFn<T extends TableCBZData> = (row: T) => string;

export type TableCBZStyleFn<T extends TableCBZData> = (row: T) => TableCBZStyle;

export type TableCBZClassFn<T extends TableCBZData> = (row: T) => string;

export type TableCBZPredicateFn<T extends TableCBZData> = (row: T) => boolean;

export interface ITableCBZAction<T extends TableCBZData = TableCBZRow> {
  id: string;
  icon: string;
  label: string;
  show?: TableCBZPredicateFn<T>;
  disabled?: TableCBZPredicateFn<T>;
}

export interface IConfigurationColumnsCBZ<T extends TableCBZData = TableCBZRow> {
  keys?: string[];
  i18n?: Record<string, string>;
  hiddensColumns?: string[];
  leftedColumns?: string[];
  tagColumns?: string[];
  classNameHeader?: Record<string, string[]>;
  styleHeader?: Record<string, TableCBZStyle>;
  style?: Record<string, TableCBZStyle>;
  styleCell?: Record<string, TableCBZStyleFn<T>>;
  align?: Record<string, TableCBZAlign>;
  format?: Record<string, TableCBZFormatFn<T>>;
  tagClass?: Record<string, TableCBZClassFn<T>>;
  cellTemplates?: Record<string, TemplateRef<{ $implicit: T }>>;
}

export interface IConfigurationPaginationCBZ {
  visible: boolean;
  pageSize: number;
  pageSizeOptions: number[];
}

export interface IConfigurationExportCBZ {
  fileName: string;
  visible?: boolean;
  includeHiddenColumns?: boolean;
  exportOnlyVisibleColumns?: boolean;
}

export interface IConfigurationRowsCBZ<T extends TableCBZData = TableCBZRow> {
  keyColumn: string;
  style?: TableCBZStyleFn<T>;
}

export interface ITableCBZ<T extends TableCBZData = TableCBZRow> {
  data: T[];
  configurationColumns?: IConfigurationColumnsCBZ<T>;
  configurationPagination?: IConfigurationPaginationCBZ;
  configurationExport?: IConfigurationExportCBZ;
  configurationRows?: IConfigurationRowsCBZ<T>;
  configurationActions?: ITableCBZAction<T>[];
  stickyHeader?: boolean;
  emptyMessage?: string;
}

export interface IEventsTableCBZ<T extends TableCBZData = TableCBZRow> {
  type: TableCBZEventType;
  action?: string;
  row?: T;
  rows?: T[];
  pageIndex?: number;
  pageSize?: number;
}
