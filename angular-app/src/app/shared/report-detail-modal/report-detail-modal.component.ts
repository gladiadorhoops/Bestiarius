import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReportSectionView } from '../../interfaces/reporte';

export interface ReportDetailModalRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-report-detail-modal',
  templateUrl: './report-detail-modal.component.html',
  styleUrls: ['./report-detail-modal.component.scss']
})
export class ReportDetailModalComponent {
  @Input() visible = false;
  @Input() title = 'Detalle del Reporte';
  @Input() imageUrl: string | ArrayBuffer | null | undefined = 'assets/no-avatar.png';
  @Input() imageAlt = 'Foto del jugador';
  @Input() loading = false;
  @Input() summaryRows: ReportDetailModalRow[] = [];
  @Input() sections: ReportSectionView[] = [];
  @Input() emptyMessage = 'Este reporte no tiene datos registrados.';
  @Input() closeButtonLabel = 'Cerrar';

  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
