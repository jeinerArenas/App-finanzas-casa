import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { ActividadService } from '../actividad/actividad.service';
import { BackendAsset, CrearActivoPayload, EditarActivoPayload } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class ActivosService {
  private readonly helper = inject(HelperService);
  private readonly actividad = inject(ActividadService);

  private readonly _activos = signal<BackendAsset[]>([]);
  readonly activos = this._activos.asReadonly();

  cargar(): void {
    this.helper.get<BackendAsset[]>('assets').subscribe((activos) => this._activos.set(activos));
  }

  crear(payload: CrearActivoPayload): Observable<BackendAsset> {
    return this.helper.post<BackendAsset>('assets', this.aBody(payload)).pipe(
      tap((creado) => {
        this._activos.update((lista) => [creado, ...lista]);
        this.actividad.registrar('agregar', `Activo: ${creado.name} · ${creado.value}`);
      }),
    );
  }

  editar(idAsset: number, payload: EditarActivoPayload): Observable<BackendAsset> {
    return this.helper.put<BackendAsset>(`assets/${idAsset}`, this.aBody(payload)).pipe(
      tap((actualizado) => {
        this._activos.update((lista) =>
          lista.map((a) => (a.id_asset === idAsset ? actualizado : a)),
        );
        this.actividad.registrar('editar', `Activo: ${actualizado.name} · ${actualizado.value}`);
      }),
    );
  }

  private aBody(payload: CrearActivoPayload): Record<string, unknown> {
    return {
      id_user: payload.idUser,
      name: payload.name,
      value: payload.value,
    };
  }
}
