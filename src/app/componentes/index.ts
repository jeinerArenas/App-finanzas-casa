export * from './shell/shell.component';
export * from './sidebar/sidebar.component';
export * from './topbar/topbar.component';
export * from './stat-card/stat-card.component';
// modal y data-table se importan por ruta directa (no desde este barrel):
// arrastran Angular Material (Dialog/Table) y ShellComponent -que sí es eager-
// reexporta este índice, así que cualquier export aquí se cuela en el chunk inicial.
