---
name: code-review-finanzas
description: Code review rules for the "Finanzas en casa" Angular frontend. Trigger this whenever reviewing a diff, a pull request, or newly written code in this repo, or when the user asks for a code review or to check that code follows the project conventions.
---

# Code review rules — Finanzas en casa

Review the changed code against the rules below. Report each violation as
`file:line — rule — what to change`. Order findings by rule number. If nothing is
wrong, say so plainly.

## Hard rules (block the change)

### 1. No comments
No `//`, `/* */` or JSDoc in `.ts`, and no `<!-- -->` in templates. Code must explain
itself through naming. The only allowed exception is an existing license header.
If a comment seems necessary, the fix is to extract a well-named function or constant.

### 2. No `any`
- No `any` type annotations, `as any`, `<any>`, `any[]`, `Array<any>`, or implicit `any`
  (missing parameter types, untyped `catch` binding used as a value, etc.).
- No `$any(...)` in templates — bind a template reference variable or a typed component
  method instead.
- Use `unknown` + narrowing, generics, or a real interface. `Record<string, unknown>` is
  fine for genuinely dynamic keyed data.

### 3. Interfaces live in the interfaces folder
Every `interface` and shared `type` alias belongs in `src/app/interfaces/<name>.interface.ts`
and must be re-exported from `src/app/interfaces/index.ts`. No `interface` declared inside a
component, service, or view file. Import types from the barrel (`../../interfaces`), not the
concrete path.

### 4. Every function is fully typed
Explicit parameter types **and** an explicit return type on every function, method, arrow
assigned to a property, and callback where the type is not inferred from an immediate typed
context. `void` for side-effect functions. Signals/`computed` created with an explicit type
argument when the initial value is `null`/`[]`/ambiguous.

### 5. No nested `if` (cognitive complexity)
- No `if` inside another `if`, and no `if` inside `else`. Flatten with guard clauses /
  early `return`, combined boolean conditions, `switch`, lookup objects/`Map`, or optional
  chaining + `??`.
- Same spirit for templates: prefer a computed signal or a `@switch` over nested `@if`.
- Keep methods short and single-purpose; extract helpers rather than deepening a branch.

## Project conventions (also flag)

### 6. Angular shape
- Standalone components, `ChangeDetectionStrategy.OnPush`, `signal`/`computed` for state
  (RxJS `Observable` only as service return types).
- **Reactive Forms only** (`FormBuilder`/`FormGroup`). No `FormsModule` / `[(ngModel)]` in
  new or refactored code.
- Feature services call `HelperService` (never `HttpClient` directly); mutating calls also
  call `ActividadService.registrar(...)`.
- Tables use `<app-tabla-cbz-v2>` — see [tabla-cbz-v2](../tabla-cbz-v2/SKILL.md).
- Styling: Tailwind utilities + `design-system.css` classes (`.card`, `.btn`, `.input`,
  `.table`, `.tag`…). No inline `style="..."`.

### 7. i18n
User-facing strings use `$localize` (with a stable `@@id`) in `.ts` and the `i18n`
attribute in templates. Flag hard-coded Spanish/English UI text.

### 8. Backend (Laravel) size limits — when the diff touches `c:\xampp\htdocs\finanzFamily`
- A class stays small and single-responsibility; split fat controllers/services.
- A method stays short (roughly ≤ 20–25 lines); extract private methods or form requests.
- Validation in Form Requests, not inline in controllers.

### 9. Naming & language
Spanish for folders, routes, and user-facing names; English for TypeScript identifiers.
