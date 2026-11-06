import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { GrantCardData } from '../../../datatype';

@Component({
  selector: 'app-card',
  imports: [DatePipe],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  @Input({ required: true }) grant!: GrantCardData;
  @Input() variant: 'tile' | 'detailed' | 'row' = 'tile';
  @Input() selected = false; // row design: selected row highlight

  @Output() favToggle = new EventEmitter<GrantCardData>();
  @Output() view = new EventEmitter<GrantCardData>();

  // Deadline me kitne din bache
  get daysLeft(): number {
    const diff = new Date(this.grant.deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  get amountAvailable(): boolean {
    return !/not available/i.test(this.grant.amount);
  }

  onFav(): void {
    this.grant.isFav = !this.grant.isFav;
    this.favToggle.emit(this.grant);
  }

  onView(): void {
    this.view.emit(this.grant);
  }
}
