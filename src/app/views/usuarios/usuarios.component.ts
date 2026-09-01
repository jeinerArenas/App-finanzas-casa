import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService, RolesService, UsuariosService } from '../../servicios';
import { ModalService } from '../../componentes/modal/modal.service';
import { DataTableComponent } from '../../componentes/data-table/data-table.component';
import { UsuarioFormComponent } from './usuario-form/usuario-form.component';
import { BackendRole, BackendUser, CrearUsuarioPayload, TableAction, TableColumn } from '../../interfaces';
import { EDIT_ICON, TRASH_ICON } from '../../utils/icons';

@Component({
  selector: 'app-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent],
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

  readonly currentUserId = computed(() => this.auth.backendUser()?.id_user);

  readonly columns: TableColumn<BackendUser>[] = [
    { field: 'document_number', header: 'Documento' },
    { field: 'full_name', header: 'Nombre' },
    { field: 'role_name', header: 'Rol', type: 'tag', tagClass: () => 'tag-neutral' },
    { field: 'email', header: 'Correo', cellClass: () => 'text-muted' },
  ];

  readonly actions: TableAction<BackendUser>[] = [
    { icon: EDIT_ICON, label: 'Editar', onClick: (u) => this.abrirEditar(u) },
    {
      icon: TRASH_ICON,
      label: 'Eliminar',
      onClick: (u) => this.eliminarUsuario(u),
      show: (u) => u.id_user !== this.currentUserId(),
    },
  ];

  constructor() {
    this.cargarUsuarios();
    this.rolesService.getRoles().subscribe((roles) => this.roles.set(roles));
  }

  abrirCrear(): void {
    this.abrirFormulario(null);
  }

  abrirEditar(usuario: BackendUser): void {
    this.abrirFormulario(usuario);
  }

  private abrirFormulario(usuario: BackendUser | null): void {
    this.modal
      .open<UsuarioFormComponent, { roles: BackendRole[]; usuario: BackendUser | null }, CrearUsuarioPayload>(
        UsuarioFormComponent,
        { roles: this.roles(), usuario },
      )
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

  eliminarUsuario(usuario: BackendUser): void {
    this.usuariosService.eliminar(usuario).subscribe({
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
