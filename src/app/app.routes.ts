import { Routes } from '@angular/router';
import { ShellComponent } from './componentes';
import { adminGuard, authGuard, guestGuard } from './guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./views/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./views/auth/registro/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./views/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'movimientos',
        loadComponent: () =>
          import('./views/movimientos/movimientos.component').then((m) => m.MovimientosComponent),
      },
      {
        path: 'deudas',
        loadComponent: () => import('./views/deudas/deudas.component').then((m) => m.DeudasComponent),
      },
      {
        path: 'categorias',
        loadComponent: () => import('./views/categorias/categorias.component').then((m) => m.CategoriasComponent),
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./views/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'actividad',
        canActivate: [adminGuard],
        loadComponent: () => import('./views/actividad/actividad.component').then((m) => m.ActividadComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
