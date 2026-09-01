import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActividadService } from '../../servicios';
import { LOG_ACTION_LABELS, TableColumn } from '../../interfaces';
import { DataTableComponent } from '../../componentes/data-table/data-table.component';

interface ActividadRow {
  id_activity_log: number;
  user_name: string;
  action: keyof typeof LOG_ACTION_LABELS;
  detail: string;
  dateFmt: string;
}

@Component({
  selector: 'app-actividad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent],
  templateUrl: './actividad.component.html',
})
export class ActividadComponent {
  private readonly actividadService = inject(ActividadService);

  readonly actionLabels = LOG_ACTION_LABELS;

  readonly rows = computed<ActividadRow[]>(() =>
    this.actividadService.logs().map((l) => ({
      ...l,
      dateFmt: new Date(l.created_at.replace(' ', 'T')).toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    })),
  );

  readonly columns: TableColumn<ActividadRow>[] = [
    { field: 'dateFmt', header: 'Fecha' },
    { field: 'user_name', header: 'Usuario' },
    {
      field: 'action',
      header: 'Acción',
      type: 'tag',
      tagClass: () => 'tag-outline',
      format: (row) => this.actionLabels[row.action],
    },
    { field: 'detail', header: 'Detalle' },
  ];

  constructor() {
    this.actividadService.cargar();
  }
}
