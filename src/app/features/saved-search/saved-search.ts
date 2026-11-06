import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SavedSearchItem, SavedSearchSortKey } from '../../../datatype';
import {
  MOCK_SAVED_SEARCHES,
  SAVED_SEARCH_LIMIT,
  SAVED_SEARCH_SORT_OPTIONS,
} from '../../core/mock-data';

@Component({
  selector: 'app-saved-search',
  imports: [FormsModule, DatePipe],
  templateUrl: './saved-search.html',
  styleUrl: './saved-search.scss',
})
export class SavedSearch {
  limit = SAVED_SEARCH_LIMIT;
  sortOptions = SAVED_SEARCH_SORT_OPTIONS;

  // Baad me Api se aayega: this.api.getSavedSearches()
  items: SavedSearchItem[] = MOCK_SAVED_SEARCHES.map((x) => ({ ...x, chips: [...x.chips] }));

  keyword = '';
  sortKey: SavedSearchSortKey = 'recent';
  confirmId: string | number | null = null; // delete confirm

  constructor(private router: Router) {}

  /* ---------- list ---------- */
  get atLimit(): boolean {
    return this.items.length >= this.limit;
  }

  get filtered(): SavedSearchItem[] {
    const kw = this.keyword.trim().toLowerCase();

    const list = this.items.filter((x) => {
      if (!kw) return true;
      return `${x.name} ${x.chips.join(' ')}`.toLowerCase().includes(kw);
    });

    return list.sort((a, b) => {
      if (this.sortKey === 'name') return a.name.localeCompare(b.name);
      if (this.sortKey === 'matches') return b.matches - a.matches;
      return b.savedOn.localeCompare(a.savedOn);
    });
  }

  /* ---------- actions ---------- */
  runSearch(s: SavedSearchItem): void {
    // Advanced Search page ye filters query params se padh sakta hai
    this.router.navigate(['/advanced-search'], { queryParams: s.params ?? {} });
  }

  newSearch(): void {
    if (this.atLimit) return;
    this.router.navigateByUrl('/advanced-search');
  }

  /* ----- delete (2 step) ----- */
  askDelete(s: SavedSearchItem): void {
    if (this.confirmId === s.id) {
      this.items = this.items.filter((x) => x.id !== s.id); // Baad me Api: delete
      this.confirmId = null;
    } else {
      this.confirmId = s.id;
    }
  }
}