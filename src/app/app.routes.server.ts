import { RenderMode, ServerRoute } from '@angular/ssr';

// La app depende de localStorage (sesión y datos) para decidir qué mostrar
// en cada ruta (guards de auth/admin), así que se renderiza en el cliente
// en vez de precompilarse en el servidor.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
