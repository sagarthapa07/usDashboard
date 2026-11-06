import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ResourceData } from '../../../datatype';

@Component({
  selector: 'app-resource-card',
  imports: [DatePipe],
  templateUrl: './resource-card.html',
  styleUrl: './resource-card.scss',
})
export class ResourceCard {
  @Input({ required: true }) item!: ResourceData;

  @Output() openItem = new EventEmitter<ResourceData>();
  @Output() download = new EventEmitter<ResourceData>();
  @Output() favToggle = new EventEmitter<ResourceData>();

  // Proposal aur EBook dono ka design same hai
  get isBook(): boolean {
    return this.item.type === 'proposal' || this.item.type === 'ebook';
  }

  // Author ke initials (GJ, NN)
  get initials(): string {
    return (this.item.author ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  // Har tag ko fix color milta hai (0 se 4)
  tagTone(tag: string): number {
    let h = 0;
    for (const c of tag) h = (h * 31 + c.charCodeAt(0)) % 5;
    return h;
  }

  onOpen(): void {
    this.openItem.emit(this.item);
  }

  onDownload(e: Event): void {
    e.stopPropagation();
    this.download.emit(this.item);
  }

  onFav(e: Event): void {
    e.stopPropagation();
    this.item.isFav = !this.item.isFav;
    this.favToggle.emit(this.item);
  }
}
