export interface TableAction<T = any> {
  icon: string;
  label: string;
  onClick: (row: T) => void;
  show?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}
