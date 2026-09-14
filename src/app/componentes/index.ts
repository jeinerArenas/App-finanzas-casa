export * from './shell/shell.component';
export * from './sidebar/sidebar.component';
export * from './topbar/topbar.component';
export * from './stat-card/stat-card.component';
// modal y tabla-cbz-v2 se importan por ruta directa (no desde este barrel):
// ShellComponent -que sí es eager- reexporta este índice, así que cualquier
// export aquí se cuela en el chunk inicial en vez de en un chunk lazy.
