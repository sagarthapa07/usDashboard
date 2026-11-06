import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchBarType, SearchBarValue, SearchTypeChip } from '../../../datatype';
import { MOCK_SEARCH_TYPES } from '../../core/mock-data';

@Component({
  selector: 'app-search-hero',
  imports: [FormsModule],
  templateUrl: './search-hero.html',
  styleUrl: './search-hero.scss',
})
export class SearchHero {
  @Output() searchChange = new EventEmitter<SearchBarValue>();

  // Type chips (mock-data.ts se, baad me API se aayega)
  types: SearchTypeChip[] = MOCK_SEARCH_TYPES;

  keyword = '';
  type: SearchBarType = 'all';
  closingSoon = false;
  includeExpired = false;

  setType(t: SearchBarType): void {
    this.type = t;
    this.emit();
  }

  toggleClosing(): void {
    this.closingSoon = !this.closingSoon;
    this.emit();
  }

  toggleExpired(): void {
    this.includeExpired = !this.includeExpired;
    this.emit();
  }

  // Search button ya Enter
  onSearch(): void {
    this.emit();
  }

  private emit(): void {
    this.searchChange.emit({
      keyword: this.keyword.trim(),
      type: this.type,
      closingSoon: this.closingSoon,
      includeExpired: this.includeExpired,
    });
  }
}