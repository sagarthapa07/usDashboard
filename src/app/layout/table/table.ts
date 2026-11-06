import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Card } from '../../shared/card/card';
import { GrantCardData } from '../../../datatype';


@Component({
  selector: 'app-table',
  imports: [Card, ],
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class Table {
  @Input() grants: GrantCardData[] = [];
  @Input() selectedId: number | string | null = null;

  @Output() select = new EventEmitter<GrantCardData>();

  onSelect(g: GrantCardData): void {
    this.selectedId = g.id;
    this.select.emit(g);
  }
}
