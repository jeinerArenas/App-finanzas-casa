import { TemplateRef } from '@angular/core';

export type TableColumnType = 'text' | 'tag' | 'custom';

export interface TableColumn<T = any> {
  field: string;
  header: string;
  type?: TableColumnType;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  format?: (row: T) => string;
  tagClass?: (row: T) => string;
  cellClass?: (row: T) => string;
  cellTemplate?: TemplateRef<{ $implicit: T }>;
}
