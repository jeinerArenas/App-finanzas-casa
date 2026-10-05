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
| `configurationPagination` | `{ visible?, pageSize?, pageSizeOptions? }` — client-side slicing + hand-rolled pager with first/prev/next/last icon buttons and a "1–8 de 42" range label. **On by default** (`visible` defaults `true`, `pageSize` defaults `10`, `pageSizeOptions` defaults `[10, 20, 30, 40]`) — omit the whole property for the defaults, or pass just the fields you want to override (e.g. `{ pageSize: 20 }`); the pager auto-hides itself when there's only one page |
| `configurationExport` | `{ fileName, visible?, includeHiddenColumns? }` — renders an icon-only "Exportar" button (cloud icon) in the toolbar that downloads CSV and also emits `exportClick` |
| `configurationSearch` | `{ visible?, placeholder?, keys? }` — built-in search box in the toolbar, **on by default** (`visible` defaults `true`); filters client-side over `keys` (defaults to all visible columns) using each column's `cellText` |
| `configurationRows` | `{ keyColumn, style? }` — `keyColumn` is the row identity used for `@for` tracking |
| `configurationActions` | `ITableCBZAction<T>[]` — `{ id, icon, label, variant?, show?, disabled? }`; `icon` is a raw SVG string (see `src/app/utils/icons.ts`). `variant` (`'view' \| 'edit' \| 'danger' \| 'success' \| 'info'`) colors the button's hover state (blue/amber/red/green/teal) instead of the neutral default — set it on every row action that has an obvious semantic (`editar` → `'edit'`, `eliminar` → `'danger'`, a "ver" action → `'view'`) |
| `configurationColumns.sortableColumns` | column keys that get a clickable funnel/sort icon in their header (defaults to **all** visible columns); click cycles asc → desc → unsorted, sorting `cellText` with `localeCompare(..., { numeric: true })` |
| `configurationToolbarActions` | `IConfigurationToolbarActionCBZ[]` — declarative toolbar buttons/checkboxes rendered on the toolbar's right side: `{ id, type: 'button' \| 'checkbox', icon?, label?, tooltip?, checked?, disabled?, show?: () => boolean }`. A `'button'` entry emits `{ type: 'toolbarActionClick', action: id }` on click; a `'checkbox'` entry emits `{ type: 'toolbarActionClick', action: id, checked }` on toggle (the component tracks the checked state internally, seeded from `checked`) |
| `stickyHeader` | boolean |
| `emptyMessage` | overrides the default empty text |

`IEventsTableCBZ<T>` = `{ type: 'actionClick' | 'exportClick' | 'pageChange' | 'rowClick' | 'searchChange' | 'sortChange' | 'toolbarActionClick'; action?; row?; rows?; pageIndex?; pageSize?; searchTerm?; sortState?; checked? }`.

### Toolbar row (search + buttons)

The component renders its own toolbar above the table: the search box (if `configurationSearch.visible` isn't explicitly `false`) and the export button on the left; on the right, in order, the declarative `configurationToolbarActions` entries, then a projected slot (`tableToolbarActions` attribute) for anything that doesn't fit the declarative shape — a `<app-selectmultsearch>`, a date-range picker, etc:

```typescript
configurationToolbarActions: [
  { id: 'actualizar', type: 'button', icon: REFRESH_ICON, tooltip: $localize`:@@comun.actualizar:Actualizar` },
  { id: 'soloPendientes', type: 'checkbox', label: $localize`:@@gastos.soloPendientes:Solo pendientes`, checked: false },
],
```

```html
<app-tabla-cbz-v2 [configuration]="tabla()" (events)="onTableEvent($event)">
  <button tableToolbarActions class="btn btn-icon btn-primary" type="button" (click)="abrirCrear()">
    +
  </button>
</app-tabla-cbz-v2>
```

Don't duplicate an "Agregar" button both in the view's own card header *and* here — pick one place (the toolbar is preferred for anything table-scoped, like a per-row-type add action or a refresh button).

### Visual style (Tailwind, no component CSS file)

The component has no `.css`/`styleUrl` — every one-off visual (toolbar, search field, sticky positioning, sort icon, row-action hover colors, pager buttons) is Tailwind utility classes built from small typed TS methods/constants (`toolbarButtonClasses`, `pagerNavButtonClasses`, `actionButtonClasses()`, `sortIconClasses()`, `headerClasses()`/`cellClasses()` for sticky columns), reaching into the design-system CSS variables via arbitrary values (`bg-[var(--color-bg)]`, `text-[color-mix(in_srgb,var(--color-text)_55%,transparent)]`) so it still adapts to light/dark. Only the base `.table`/`.table th`/`.table td` rules stay in `design-system.css`, since `.table` is one of the project's named shared classes. When a Tailwind utility must beat an unlayered `.input`-family property (e.g. forcing the search input's padding/radius/font-size), append the trailing `!` important modifier (`pl-8!`) per the Styling convention in `CLAUDE.md` — don't add new rules to `design-system.css` or a component `.css` file for table-local one-offs.

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
    { id: 'editar', icon: EDIT_ICON, label: $localize`:@@comun.editar:Editar`, variant: 'edit' },
    {
      id: 'eliminar',
      icon: TRASH_ICON,
      label: $localize`:@@comun.eliminar:Eliminar`,
      variant: 'danger',
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
