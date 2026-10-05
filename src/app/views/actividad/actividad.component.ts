import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActividadService } from '../../servicios';
import { ActividadRow, ITableCBZ, LOG_ACTION_LABELS } from '../../interfaces';
import { TablaCbzV2Component } from '../../componentes/tabla-cbz-v2/tabla-cbz-v2.component';

@Component({
  selector: 'app-actividad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TablaCbzV2Component],
  templateUrl: './actividad.component.html',
})
export class ActividadComponent {
  private readonly actividadService = inject(ActividadService);

  readonly actionLabels = LOG_ACTION_LABELS;

  readonly rows = computed<ActividadRow[]>(() =>
    this.actividadService.logs().map((log) => ({
      id_activity_log: log.id_activity_log,
      user_name: log.user_name,
      action: log.action,
      detail: log.detail,
      dateFmt: new Date(log.created_at.replace(' ', 'T')).toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    })),
  );

  readonly tabla = computed<ITableCBZ<ActividadRow>>(() => ({
    data: this.rows(),
    configurationColumns: {
      keys: ['dateFmt', 'user_name', 'action', 'detail'],
      i18n: {
        dateFmt: $localize`:@@actividad.col.fecha:Fecha`,
        user_name: $localize`:@@actividad.col.usuario:Usuario`,
        action: $localize`:@@actividad.col.accion:Acción`,
        detail: $localize`:@@actividad.col.detalle:Detalle`,
      },
      tagColumns: ['action'],
      tagClass: { action: () => 'tag-outline' },
      format: { action: (row: ActividadRow) => this.actionLabels[row.action] },
    },
    configurationPagination: { visible: true, pageSize: 6, pageSizeOptions: [6, 10, 20, 30, 50] },
    configurationExport: { fileName: $localize`:@@actividad.export.archivo:actividad` },
    configurationRows: { keyColumn: 'id_activity_log' },
    emptyMessage: $localize`:@@actividad.vacio:Todavía no hay actividad registrada.`,
  }));

  constructor() {
    this.actividadService.cargar();
  }
}
