import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  ActivosService,
  AuthService,
  IngresosService,
  SalariosService,
  UsuariosService,
} from '../../servicios';
import { ModalService } from '../../componentes/modal/modal.service';
import { TablaCbzV2Component } from '../../componentes/tabla-cbz-v2/tabla-cbz-v2.component';
import {
  SalarioFormComponent,
  SalarioFormData,
  SalarioFormResult,
} from './salario-form/salario-form.component';
import { IngresoFormComponent, IngresoFormData } from './ingreso-form/ingreso-form.component';
import { ActivoFormComponent, ActivoFormData } from './activo-form/activo-form.component';
import {
  BackendAsset,
  BackendIncome,
  BackendSalary,
  BackendSalaryVariable,
  BackendUser,
  CrearActivoPayload,
  CrearIngresoPayload,
  CrearSalarioPayload,
  CrearVariablePayload,
  IEventsTableCBZ,
  ITableCBZ,
} from '../../interfaces';
import { formatCurrency } from '../../utils/currency';
import { EDIT_ICON } from '../../utils/icons';

type TabIngresos = 'salario' | 'activos';

interface SalarioVigente {
  salario: BackendSalary;
  variable: BackendSalaryVariable | null;
  total: number;
}

interface FilaIngreso {
  key: string;
  refId: number;
  tipo: 'salario' | 'ingreso';
  tipoLabel: string;
  quien: string;
  detalle: string;
  monto: number;
  fecha: string;
  fechaOrden: string;
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function estaVigente(rango: { start_date: string; end_date: string | null }): boolean {
  const hoy = hoyIso();
  if (rango.start_date > hoy) return false;
  return rango.end_date === null || rango.end_date >= hoy;
}

@Component({
  selector: 'app-ingresos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TablaCbzV2Component],
  templateUrl: './ingresos.component.html',
})
export class IngresosComponent {
  private readonly salariosService = inject(SalariosService);
  private readonly ingresosService = inject(IngresosService);
  private readonly activosService = inject(ActivosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);

  readonly error = signal('');
  readonly miembros = signal<BackendUser[]>([]);
  readonly tab = signal<TabIngresos>('salario');

  readonly salariosVigentes = computed<SalarioVigente[]>(() => {
    const salarios = this.salariosService.salarios();
    const variables = this.salariosService.variables();
    const porUsuario = new Map<number, BackendSalary>();

    for (const s of salarios) {
      if (!estaVigente(s)) continue;
      const actual = porUsuario.get(s.id_user);
      if (!actual || s.start_date > actual.start_date) porUsuario.set(s.id_user, s);
    }

    return [...porUsuario.values()].map((salario) => {
      const variable =
        variables.find((v) => v.id_salary === salario.id_salary && estaVigente(v)) ?? null;
      return {
        salario,
        variable,
        total: Number(salario.amount) + (variable ? Number(variable.amount) : 0),
      };
    });
  });

  readonly filasIngreso = computed<FilaIngreso[]>(() => {
    const variables = this.salariosService.variables();

    const filasSalario: FilaIngreso[] = this.salariosService.salarios().map((s) => {
      const variable = variables.find((v) => v.id_salary === s.id_salary);
      const detalle = variable
        ? `${$localize`:@@ingresos.tabla.salario:Salario`} + ${variable.description || $localize`:@@ingresos.tabla.variable:variable`}`
        : $localize`:@@ingresos.tabla.salario:Salario`;

      return {
        key: `salario-${s.id_salary}`,
        refId: s.id_salary,
        tipo: 'salario' as const,
        tipoLabel: $localize`:@@ingresos.tipo.salario:Salario`,
        quien: s.user_full_name,
        detalle,
        monto: Number(s.amount) + (variable ? Number(variable.amount) : 0),
        fecha: s.end_date
          ? `${s.start_date} — ${s.end_date}`
          : `${$localize`:@@ingresos.tabla.desde:Desde`} ${s.start_date}`,
        fechaOrden: s.start_date,
      };
    });

    const filasIngresoManual: FilaIngreso[] = this.ingresosService.ingresos().map((i) => ({
      key: `ingreso-${i.id_income}`,
      refId: i.id_income,
      tipo: 'ingreso' as const,
      tipoLabel: $localize`:@@ingresos.tipo.ingreso:Ingreso`,
      quien: i.user_full_name,
      detalle: i.concept,
      monto: Number(i.amount),
      fecha: i.income_date,
      fechaOrden: i.income_date,
    }));

    return [...filasSalario, ...filasIngresoManual].sort((a, b) =>
      b.fechaOrden.localeCompare(a.fechaOrden),
    );
  });

  readonly tablaIngresos = computed<ITableCBZ<FilaIngreso>>(() => ({
    data: this.filasIngreso(),
    configurationColumns: {
      keys: ['tipoLabel', 'quien', 'detalle', 'monto', 'fecha'],
      i18n: {
        tipoLabel: $localize`:@@ingresos.col.tipo:Tipo`,
        quien: $localize`:@@ingresos.col.quien:Quién`,
        detalle: $localize`:@@ingresos.col.detalle:Detalle`,
        monto: $localize`:@@ingresos.col.monto:Monto`,
        fecha: $localize`:@@ingresos.col.fecha:Fecha`,
      },
      tagColumns: ['tipoLabel'],
      tagClass: {
        tipoLabel: (f: FilaIngreso) => (f.tipo === 'salario' ? 'tag-outline' : 'tag-neutral'),
      },
      format: { monto: (f: FilaIngreso) => this.fmt(f.monto) },
    },
    configurationRows: { keyColumn: 'key' },
    configurationActions: [
      { id: 'editar', icon: EDIT_ICON, label: $localize`:@@comun.editar:Editar` },
    ],
    configurationPagination: { visible: true, pageSize: 10, pageSizeOptions: [10, 20, 30] },
    stickyHeader: true,
    emptyMessage: $localize`:@@ingresos.tabla.vacio:Aún no hay salarios ni ingresos registrados.`,
  }));

  readonly tablaActivos = computed<ITableCBZ<BackendAsset>>(() => ({
    data: this.activosService.activos(),
    configurationColumns: {
      keys: ['user_full_name', 'name', 'value'],
      i18n: {
        user_full_name: $localize`:@@ingresos.col.quien:Quién`,
        name: $localize`:@@ingresos.activo.nombre:Nombre del activo`,
        value: $localize`:@@ingresos.activo.valor:Valor actual`,
      },
      format: { value: (a: BackendAsset) => this.fmt(a.value) },
    },
    configurationRows: { keyColumn: 'id_asset' },
    configurationActions: [
      { id: 'editar', icon: EDIT_ICON, label: $localize`:@@comun.editar:Editar` },
    ],
    stickyHeader: true,
    emptyMessage: $localize`:@@ingresos.activos.vacio:Aún no hay activos registrados.`,
  }));

  constructor() {
    this.salariosService.cargar();
    this.ingresosService.cargar();
    this.activosService.cargar();
    this.usuariosService.listar().subscribe((miembros) => this.miembros.set(miembros));
  }

  setTab(tab: TabIngresos): void {
    this.tab.set(tab);
  }

  onFilaEvent(event: IEventsTableCBZ<FilaIngreso>): void {
    if (event.type !== 'actionClick' || !event.row || event.action !== 'editar') return;
    if (event.row.tipo === 'salario') this.editarFilaSalario(event.row.refId);
    if (event.row.tipo === 'ingreso') this.editarFilaIngreso(event.row.refId);
  }

  onActivoEvent(event: IEventsTableCBZ<BackendAsset>): void {
    if (event.type !== 'actionClick' || !event.row) return;
    if (event.action === 'editar') this.abrirFormularioActivo(event.row);
  }

  abrirCrearSalario(): void {
    this.abrirFormularioSalario(null);
  }

  editarSalarioVigente(vigente: SalarioVigente): void {
    this.abrirFormularioSalario(vigente.salario);
  }

  abrirCrearIngreso(): void {
    this.abrirFormularioIngreso(null);
  }

  abrirCrearActivo(): void {
    this.abrirFormularioActivo(null);
  }

  fmt(amount: string | number): string {
    return formatCurrency(Number(amount));
  }

  private editarFilaSalario(idSalary: number): void {
    const salario = this.salariosService.salarios().find((s) => s.id_salary === idSalary);
    if (salario) this.abrirFormularioSalario(salario);
  }

  private editarFilaIngreso(idIncome: number): void {
    const ingreso = this.ingresosService.ingresos().find((i) => i.id_income === idIncome);
    if (ingreso) this.abrirFormularioIngreso(ingreso);
  }

  private abrirFormularioSalario(salario: BackendSalary | null): void {
    const variableActual = salario
      ? (this.salariosService
          .variables()
          .find((v) => v.id_salary === salario.id_salary && estaVigente(v)) ?? null)
      : null;

    this.modal
      .open<SalarioFormComponent, SalarioFormData, SalarioFormResult>(SalarioFormComponent, {
        salario,
        variableActual,
        miembros: this.miembros(),
        idUsuarioActual: this.auth.backendUser()?.id_user ?? null,
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado) this.guardarSalario(resultado, salario, variableActual);
      });
  }

  private guardarSalario(
    resultado: SalarioFormResult,
    enEdicion: BackendSalary | null,
    variableEnEdicion: BackendSalaryVariable | null,
  ): void {
    const payload: CrearSalarioPayload = {
      idUser: resultado.idUser,
      amount: resultado.amount,
      startDate: resultado.startDate,
    };
    const accion = enEdicion
      ? this.salariosService.editar(enEdicion.id_salary, payload)
      : this.salariosService.crear(payload);

    accion.subscribe({
      next: (salario) => {
        this.error.set('');
        this.guardarVariableDeSalario(resultado.variable, salario, variableEnEdicion);
      },
      error: (err: Error) => this.error.set(err.message),
    });
  }

  private guardarVariableDeSalario(
    variable: SalarioFormResult['variable'],
    salario: BackendSalary,
    variableEnEdicion: BackendSalaryVariable | null,
  ): void {
    if (!variable) return;

    if (variableEnEdicion) {
      this.salariosService
        .editarVariable(variableEnEdicion.id_salary_variable, variable)
        .subscribe({ error: (err: Error) => this.error.set(err.message) });
      return;
    }

    const payload: CrearVariablePayload = { ...variable, startDate: salario.start_date };
    this.salariosService
      .crearVariable(salario.id_salary, payload)
      .subscribe({ error: (err: Error) => this.error.set(err.message) });
  }

  private abrirFormularioIngreso(ingreso: BackendIncome | null): void {
    this.modal
      .open<IngresoFormComponent, IngresoFormData, CrearIngresoPayload>(IngresoFormComponent, {
        ingreso,
        miembros: this.miembros(),
        idUsuarioActual: this.auth.backendUser()?.id_user ?? null,
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.guardarIngreso(payload, ingreso);
      });
  }

  private guardarIngreso(payload: CrearIngresoPayload, enEdicion: BackendIncome | null): void {
    const accion = enEdicion
      ? this.ingresosService.editar(enEdicion.id_income, payload)
      : this.ingresosService.crear(payload);

    accion.subscribe({
      next: () => this.error.set(''),
      error: (err: Error) => this.error.set(err.message),
    });
  }

  private abrirFormularioActivo(activo: BackendAsset | null): void {
    this.modal
      .open<ActivoFormComponent, ActivoFormData, CrearActivoPayload>(ActivoFormComponent, {
        activo,
        miembros: this.miembros(),
        idUsuarioActual: this.auth.backendUser()?.id_user ?? null,
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.guardarActivo(payload, activo);
      });
  }

  private guardarActivo(payload: CrearActivoPayload, enEdicion: BackendAsset | null): void {
    const accion = enEdicion
      ? this.activosService.editar(enEdicion.id_asset, payload)
      : this.activosService.crear(payload);

    accion.subscribe({
      next: () => this.error.set(''),
      error: (err: Error) => this.error.set(err.message),
    });
  }
}
