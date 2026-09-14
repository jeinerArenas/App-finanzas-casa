import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HelperService } from '../helper/helper.service';
import { ActividadService } from '../actividad/actividad.service';
import { BackendUser, CrearUsuarioPayload, EditarUsuarioPayload } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly helper = inject(HelperService);
  private readonly actividad = inject(ActividadService);

  listar(): Observable<BackendUser[]> {
    return this.helper.get<BackendUser[]>('users');
  }

  crear(payload: CrearUsuarioPayload): Observable<BackendUser> {
    return this.helper
      .post<BackendUser>('users', {
        document_number: payload.documentNumber,
        full_name: payload.fullName,
        email: payload.email,
        id_role: payload.idRole,
      })
      .pipe(
        tap((creado) =>
          this.actividad.registrar('agregar', `${creado.full_name} (${creado.role_name})`),
        ),
      );
  }

  editar(idUser: number, payload: EditarUsuarioPayload): Observable<BackendUser> {
    return this.helper
      .put<BackendUser>(`users/${idUser}`, {
        document_number: payload.documentNumber,
        full_name: payload.fullName,
        email: payload.email,
        id_role: payload.idRole,
      })
      .pipe(tap((actualizado) => this.actividad.registrar('editar', actualizado.full_name)));
  }

  eliminar(usuario: BackendUser): Observable<void> {
    return this.helper
      .delete<void>(`users/${usuario.id_user}`)
      .pipe(tap(() => this.actividad.registrar('eliminar', usuario.full_name)));
  }
}
