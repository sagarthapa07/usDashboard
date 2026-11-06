import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownItem, GrantCardData } from '../../../datatype';
import {
  DEFAULT_ELIGIBILITY,
  MOCK_AREAS,
  MOCK_FREE_GRANTS,
  MOCK_STATES,
} from '../../core/mock-data';
import { Pagination } from '../../shared/pagination/pagination';
import { Buttons } from '../../shared/buttons/buttons';
import { Router } from '@angular/router';

interface FreeFilter {
  state: string;
  area: string;
}

// Is page ke apne sort options
type FreeSort = 'new' | 'old' | 'rel';

@Component({
  selector: 'app-deadline-free-grants',
  imports: [FormsModule, DatePipe, Pagination, Buttons],
  templateUrl: './deadline-free-grants.html',
  styleUrl: './deadline-free-grants.scss',
})
export class DeadlineFreeGrant {
  constructor(private router: Router) {}
  /* =====================================================
     DATA
     ===================================================== */
  states: DropdownItem[] = MOCK_STATES;
  areas: DropdownItem[] = MOCK_AREAS;
  cards: GrantCardData[] = structuredClone(MOCK_FREE_GRANTS);

  sortOptions: { key: FreeSort; label: string }[] = [
    { key: 'new', label: 'Newest first' },
    { key: 'old', label: 'Oldest first' },
    { key: 'rel', label: 'Most Relevant' },
  ];

  /* =====================================================
     PAGE KI STATE
     ===================================================== */
  draft: FreeFilter = { state: '', area: '' };
  applied: FreeFilter = { state: '', area: '' };

  sortKey: FreeSort = 'new';
  selectedId: number | string | null = null;

  currentPage = 1;
  pageSize = 8;

  // Mobile state (sirf CSS se asar karta hai)
  filtersOpen = false;
  detailOpen = false;
  private listScroll = 0;

  /* =====================================================
     FILTER + SORT + PAGINATION
     (Deadline nahi hai, isliye date check bhi nahi)
     ===================================================== */
  get filteredCards(): GrantCardData[] {
    const f = this.applied;

    const list = this.cards.filter((c) => {
      if (f.state && c.state !== f.state) return false;
      if (f.area && c.category !== f.area) return false;
      return true;
    });

    return list.sort((a, b) => {
      switch (this.sortKey) {
        case 'old':
          return (a.posted ?? '').localeCompare(b.posted ?? '');
        case 'rel':
          return Number(a.id) - Number(b.id); // data ka original order
        default:
          return (b.posted ?? '').localeCompare(a.posted ?? ''); // newest first
      }
    });
  }

  get pagedCards(): GrantCardData[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCards.slice(start, start + this.pageSize);
  }

  get selected(): GrantCardData | null {
    const page = this.pagedCards;
    return page.find((c) => c.id === this.selectedId) ?? page[0] ?? null;
  }

  get activeFilterCount(): number {
    return [this.applied.state, this.applied.area].filter(Boolean).length;
  }

  isSelected(g: GrantCardData): boolean {
    return this.selected?.id === g.id;
  }

  sourceLabel(g: GrantCardData): string {
    if (g.source === 'federal') return 'US Federal';
    if (g.source === 'foundation') return 'Private Foundation';
    return 'Funder';
  }

  eligibilityOf(g: GrantCardData): string[] {
    return g.eligibility?.length ? g.eligibility : DEFAULT_ELIGIBILITY;
  }

  /* =====================================================
     MOBILE helpers
     ===================================================== */
  private get isMobile(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  closeDetail(): void {
    this.detailOpen = false;
    setTimeout(() => window.scrollTo({ top: this.listScroll }), 0);
  }

  /* =====================================================
     EVENTS
     ===================================================== */
  onSearch(): void {
    this.applied = { ...this.draft };
    this.currentPage = 1;
    this.filtersOpen = false;
  }

  onReset(): void {
    this.draft = { state: '', area: '' };
    this.applied = { ...this.draft };
    this.currentPage = 1;
  }

  onAdvanced(): void {
    console.log('Advanced Search'); // TODO: advanced search page ka route
  }

  onSort(v: FreeSort): void {
    this.sortKey = v;
    this.currentPage = 1;
  }

  onSelect(g: GrantCardData): void {
    this.selectedId = g.id;
    this.detailOpen = true;

    if (this.isMobile) {
      this.listScroll = window.scrollY;
      window.scrollTo({ top: 0 });
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  toggleSave(g: GrantCardData): void {
    g.isFav = !g.isFav;
  }

  onView(g: GrantCardData): void {
    this.router.navigate(['/grant', g.id]);
  }
}
