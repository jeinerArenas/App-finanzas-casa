import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService, RolesService, UsuariosService } from '../../servicios';
import { ModalService } from '../../componentes/modal/modal.service';
import { TablaCbzV2Component } from '../../componentes/tabla-cbz-v2/tabla-cbz-v2.component';
import { UsuarioFormComponent } from './usuario-form/usuario-form.component';
import {
  BackendRole,
  BackendUser,
  CrearUsuarioPayload,
  IEventsTableCBZ,
  ITableCBZ,
} from '../../interfaces';
import { EDIT_ICON, TRASH_ICON } from '../../utils/icons';

@Component({
  selector: 'app-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TablaCbzV2Component],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent {
  private readonly usuariosService = inject(UsuariosService);
  private readonly rolesService = inject(RolesService);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);

  readonly usuarios = signal<BackendUser[]>([]);
  readonly roles = signal<BackendRole[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  readonly currentUserId = computed<number | undefined>(() => this.auth.backendUser()?.id_user);

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
      style: { email: { color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' } },
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

  constructor() {
    this.cargarUsuarios();
    this.rolesService.getRoles().subscribe((roles) => this.roles.set(roles));
  }

  onTableEvent(event: IEventsTableCBZ<BackendUser>): void {
    if (event.type !== 'actionClick' || !event.row) return;
    if (event.action === 'editar') this.abrirEditar(event.row);
    if (event.action === 'eliminar') this.eliminarUsuario(event.row);
  }

  abrirCrear(): void {
    this.abrirFormulario(null);
  }

  abrirEditar(usuario: BackendUser): void {
    this.abrirFormulario(usuario);
  }

  eliminarUsuario(usuario: BackendUser): void {
    this.usuariosService.eliminar(usuario).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err: Error) => this.error.set(err.message),
    });
  }

  private abrirFormulario(usuario: BackendUser | null): void {
    this.modal
      .open<
        UsuarioFormComponent,
        { roles: BackendRole[]; usuario: BackendUser | null },
        CrearUsuarioPayload
      >(UsuarioFormComponent, { roles: this.roles(), usuario })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.guardarUsuario(payload, usuario);
      });
  }

  private guardarUsuario(payload: CrearUsuarioPayload, enEdicion: BackendUser | null): void {
    const accion = enEdicion
      ? this.usuariosService.editar(enEdicion.id_user, payload)
      : this.usuariosService.crear(payload);

    accion.subscribe({
      next: () => this.cargarUsuarios(),
      error: (err: Error) => this.error.set(err.message),
    });
  }

  private cargarUsuarios(): void {
    this.cargando.set(true);
    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.cargando.set(false);
      },
    });
  }
}
