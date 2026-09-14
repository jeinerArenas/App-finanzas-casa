---
name: tabla-cbz-v2
description: How to use and implement the standalone `<app-tabla-cbz-v2>` component for data tables in the "Finanzas en casa" Angular project. Trigger this whenever the user wants to create a NEW table or grid of data, or migrate an existing one.
---

# Implementing the `<app-tabla-cbz-v2>` component

`TablaCbzV2Component` (`src/app/componentes/tabla-cbz-v2/tabla-cbz-v2.component.ts`) is the
single standard table component in this project. It replaced the old `<app-data-table>`
(deleted). Use it for every table/grid.

## Key rules

1. **Standalone.** `standalone: true`, `ChangeDetectionStrategy.OnPush`, signals only.
2. **Import by direct path**, never from the `componentes` barrel:
   `import { TablaCbzV2Component } from '../../componentes/tabla-cbz-v2/tabla-cbz-v2.component';`
   (`ShellComponent` is eager and re-exports the barrel — a barrel entry would land in the
   initial bundle instead of the view's lazy chunk.)
3. **Single `[configuration]` input** of type `ITableCBZ<T>` (`src/app/interfaces/table-cbz.interface.ts`).
   Build it in a `computed()` so it reacts to signal data.
4. **Single `(events)` output** of type `IEventsTableCBZ<T>`. All row actions, pagination and
   export come through it. Dispatch on `event.type` + `event.action` with guard clauses (no
   nested `if`).
5. **i18n is mandatory.** Column headers and every user-facing string in the config go through
   `$localize` in the `.ts`; static text in the component's own template uses the `i18n`
   attribute. Give every message a stable id: `` $localize`:@@feature.col.name:Texto` ``.
6. Follow the [code review rules](../code-review-finanzas/SKILL.md): no `any`, no comments,
   interfaces live in `src/app/interfaces`, every function typed.

## `ITableCBZ<T>` shape

| property | purpose |
| --- | --- |
| `data: T[]` | rows to render (required) |
| `configurationColumns` | `keys` (explicit column order — keep headers visible when data is empty), `i18n` (key → `$localize` label), `hiddensColumns`, `leftedColumns` (sticky-left), `tagColumns` + `tagClass`, `format` (key → `(row) => string`), `style` / `styleHeader` (static CSS maps), `styleCell` (key → `(row) => Record<string,string>`), `align`, `classNameHeader`, `cellTemplates` (key → `TemplateRef`) |
| `configurationPagination` | `{ visible, pageSize, pageSizeOptions }` — client-side slicing + hand-rolled pager |
| `configurationExport` | `{ fileName, visible?, includeHiddenColumns? }` — renders an "Exportar" button that downloads CSV and also emits `exportClick` |
| `configurationRows` | `{ keyColumn, style? }` — `keyColumn` is the row identity used for `@for` tracking |
| `configurationActions` | `ITableCBZAction<T>[]` — `{ id, icon, label, show?, disabled? }`; `icon` is a raw SVG string (see `src/app/utils/icons.ts`) |
| `stickyHeader` | boolean |
| `emptyMessage` | overrides the default empty text |

`IEventsTableCBZ<T>` = `{ type: 'actionClick' | 'exportClick' | 'pageChange' | 'rowClick'; action?; row?; rows?; pageIndex?; pageSize? }`.

## TypeScript pattern

```typescript
readonly tabla = computed<ITableCBZ<BackendUser>>(() => ({
  data: this.usuarios(),
  configurationColumns: {
    keys: ['document_number', 'full_name', 'role_name', 'email'],
    i18n: {
      document_number: $localize`:@@usuarios.col.documento:Documento`,
      full_name: $localize`:@@usuarios.col.nombre:Nombre`,
      role_name: $localize`:@@usuarios.col.rol:Rol`,
      email: $localize`:@@usuarios.col.correo:Correo`,
    },
    tagColumns: ['role_name'],
  },
  configurationRows: { keyColumn: 'id_user' },
  configurationActions: [
    { id: 'editar', icon: EDIT_ICON, label: $localize`:@@comun.editar:Editar` },
    {
      id: 'eliminar',
      icon: TRASH_ICON,
      label: $localize`:@@comun.eliminar:Eliminar`,
      show: (usuario: BackendUser) => usuario.id_user !== this.currentUserId(),
    },
  ],
  stickyHeader: true,
  emptyMessage: $localize`:@@usuarios.vacio:No hay usuarios registrados en tu familia.`,
}));

onTableEvent(event: IEventsTableCBZ<BackendUser>): void {
  if (event.type !== 'actionClick' || !event.row) return;
  if (event.action === 'editar') this.abrirEditar(event.row);
  if (event.action === 'eliminar') this.eliminarUsuario(event.row);
}
```

## Template pattern

```html
<app-tabla-cbz-v2 [configuration]="tabla()" (events)="onTableEvent($event)" />
```

## Custom cell (escape hatch)

Declare a bare `<ng-template #cell let-row>` in the consuming component's template, grab it with
`viewChild<TemplateRef<{ $implicit: T }>>('cell')`, and put it in `configurationColumns.cellTemplates`
under the column key. Build that map with a typed helper (guard clauses, no `any`) — see
`src/app/views/categorias/categorias.component.ts` and `movimientos.component.ts`.

## i18n setup (already wired)

- `@angular/localize` is a dependency; `@angular/localize/init` is the build/test polyfill
  (`angular.json` → `build.options.polyfills`, `test.options.setupFiles` → `src/test-setup.ts`).
- `"@angular/localize"` is in `tsconfig.app.json` / `tsconfig.spec.json` `types`.
- Extract with `ng extract-i18n`. Single locale (`es`) for now; add target locales in
  `angular.json` `i18n` + build `localize` when translations exist.

## Reference implementations

`usuarios`, `deudas`, `gastos` (custom cell + actions, month-filtered), `ingresos` (tabs +
a merged-row-model table blending two different backend record types into one `T`, "editar"
re-deriving which underlying record/form to open from a `tipo` discriminator field),
`categorias` (modal form action + conditional custom cell), `actividad` (pagination + export),
`dashboard` (`styleCell`).
