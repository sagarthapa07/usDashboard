import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ResourceCard } from '../../shared/resource-card/resource-card';
import { ResourceData, ResourceType } from '../../../datatype';
import { RESOURCE_ACTION_LABEL } from '../../core/mock-data';

@Component({
  selector: 'app-resource-list',
  imports: [ResourceCard, DatePipe],
  templateUrl: './resource-list.html',
  styleUrl: './resource-list.scss',
})
export class ResourceList {
  @Input() items: ResourceData[] = [];
  @Input() type: ResourceType = 'proposal';
  @Input() view: 'cards' | 'table' = 'cards';

  @Output() openItem = new EventEmitter<ResourceData>();
  @Output() download = new EventEmitter<ResourceData>();
  @Output() favToggle = new EventEmitter<ResourceData>();

  get isBook(): boolean {
    return this.type === 'proposal' || this.type === 'ebook';
  }

  // Table me "Details" column ka text
  details(it: ResourceData): string {
    switch (it.type) {
      case 'proposal':
      case 'ebook':
        return `PDF · ${it.fileSize} · ${it.pages} pages`;
      case 'video':
        return `${it.minutes} min · ${it.presenter}`;
      case 'article':
        return `${it.readMinutes} min read`;
      default:
        return `${it.minutes} min · ${it.author}`;
    }
  }

  // Table me button ka naam (mock-data.ts se)
  actionLabel(it: ResourceData): string {
    return RESOURCE_ACTION_LABEL[it.type];
  }

  isBookItem(it: ResourceData): boolean {
    return it.type === 'proposal' || it.type === 'ebook';
  }

  onDownload(e: Event, it: ResourceData): void {
    e.stopPropagation();
    this.download.emit(it);
  }
}