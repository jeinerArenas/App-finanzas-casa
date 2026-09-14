import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { ActividadService } from '../actividad/actividad.service';
import {
  BackendSalary,
  BackendSalaryVariable,
  CrearSalarioPayload,
  CrearVariablePayload,
  EditarSalarioPayload,
  EditarVariablePayload,
} from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class SalariosService {
  private readonly helper = inject(HelperService);
  private readonly actividad = inject(ActividadService);

  private readonly _salarios = signal<BackendSalary[]>([]);
  private readonly _variables = signal<BackendSalaryVariable[]>([]);
  readonly salarios = this._salarios.asReadonly();
  readonly variables = this._variables.asReadonly();

  cargar(): void {
    this.helper
      .get<BackendSalary[]>('salaries')
      .subscribe((salarios) => this._salarios.set(salarios));
    this.helper
      .get<BackendSalaryVariable[]>('salaries/variables')
      .subscribe((variables) => this._variables.set(variables));
  }

  crear(payload: CrearSalarioPayload): Observable<BackendSalary> {
    return this.helper.post<BackendSalary>('salaries', this.aBody(payload)).pipe(
      tap((creado) => {
        this._salarios.update((lista) => [creado, ...lista]);
        this.actividad.registrar('agregar', `Salario: ${creado.user_full_name} · ${creado.amount}`);
      }),
    );
  }

  editar(idSalary: number, payload: EditarSalarioPayload): Observable<BackendSalary> {
    return this.helper.put<BackendSalary>(`salaries/${idSalary}`, this.aBody(payload)).pipe(
      tap((actualizado) => {
        this._salarios.update((lista) =>
          lista.map((s) => (s.id_salary === idSalary ? actualizado : s)),
        );
        this.actividad.registrar(
          'editar',
          `Salario: ${actualizado.user_full_name} · ${actualizado.amount}`,
        );
      }),
    );
  }

  crearVariable(
    idSalary: number,
    payload: CrearVariablePayload,
  ): Observable<BackendSalaryVariable> {
    return this.helper
      .post<BackendSalaryVariable>(
        `salaries/${idSalary}/variables`,
        this.crearVariableBody(payload),
      )
      .pipe(
        tap((creada) => {
          this._variables.update((lista) => [creada, ...lista]);
          this.actividad.registrar(
            'agregar',
            `Variable: ${creada.user_full_name} · ${creada.amount}`,
          );
        }),
      );
  }

  editarVariable(
    idSalaryVariable: number,
    payload: EditarVariablePayload,
  ): Observable<BackendSalaryVariable> {
    return this.helper
      .put<BackendSalaryVariable>(
        `salaries/variables/${idSalaryVariable}`,
        this.editarVariableBody(payload),
      )
      .pipe(
        tap((actualizada) => {
          this._variables.update((lista) =>
            lista.map((v) => (v.id_salary_variable === idSalaryVariable ? actualizada : v)),
          );
          this.actividad.registrar(
            'editar',
            `Variable: ${actualizada.user_full_name} · ${actualizada.amount}`,
          );
        }),
      );
  }

  private aBody(payload: CrearSalarioPayload): Record<string, unknown> {
    return {
      id_user: payload.idUser,
      amount: payload.amount,
      start_date: payload.startDate,
    };
  }

  private crearVariableBody(payload: CrearVariablePayload): Record<string, unknown> {
    return {
      description: payload.description,
      amount: payload.amount,
      start_date: payload.startDate,
    };
  }

  private editarVariableBody(payload: EditarVariablePayload): Record<string, unknown> {
    return {
      description: payload.description,
      amount: payload.amount,
    };
  }
}
