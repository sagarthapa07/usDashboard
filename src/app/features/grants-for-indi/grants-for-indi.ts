import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownItem, GrantCardData, SortKey, SortOption } from '../../../datatype';
import {
  IND_ELIGIBILITY,
  IND_SORT_OPTIONS,
  MOCK_AREAS,
  MOCK_IND_GRANTS,
  MOCK_STATES,
} from '../../core/mock-data';
import { Table } from '../../layout/table/table';
import { Pagination } from '../../shared/pagination/pagination';
import { Buttons } from '../../shared/buttons/buttons';
import { Router } from '@angular/router';

// Filter bar ki values
interface IndFilter {
  state: string;
  area: string;
  from: string;
  to: string;
}

@Component({
  selector: 'app-grants-for-indi',
  imports: [FormsModule, DatePipe, Table, Pagination, Buttons],
  templateUrl: './grants-for-indi.html',
  styleUrl: './grants-for-indi.scss',
})
export class GrantsForINDI {
  constructor(private router: Router) {}
  /* =====================================================
     DATA: mock-data.ts se (baad me API se aayega)
     ===================================================== */
  sortOptions: SortOption[] = IND_SORT_OPTIONS;
  states: DropdownItem[] = MOCK_STATES;
  areas: DropdownItem[] = MOCK_AREAS;
  cards: GrantCardData[] = structuredClone(MOCK_IND_GRANTS);

  /* =====================================================
     PAGE KI STATE
     ===================================================== */
  // draft = form me abhi jo chun rahe ho, applied = Search dabane ke baad wali
  draft: IndFilter = { state: '', area: '', from: '', to: '' };
  applied: IndFilter = { state: '', area: '', from: '', to: '' };

  sortKey: SortKey = 'newest';

  // Design jaisa: pehle se dusri grant selected dikhe
  selectedId: number | string | null = 602;

  currentPage = 1;
  pageSize = 10;

  /* =====================================================
     MOBILE STATE (sirf mobile par asar, CSS se)
     ===================================================== */
  filtersOpen = false;
  detailOpen = false;

  // Back dabane par list wahin dikhane ke liye scroll yaad rakhte hain
  private listScroll = 0;

  /* =====================================================
     FILTER + SORT + PAGINATION
     ===================================================== */
  private get today(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  get filteredCards(): GrantCardData[] {
    const f = this.applied;

    const list = this.cards.filter((c) => {
      if (c.deadline < this.today) return false; // nikal chuke grants nahi dikhane
      if (f.state && c.state !== f.state) return false;
      if (f.area && c.category !== f.area) return false;
      if (f.from && (!c.posted || c.posted < f.from)) return false;
      if (f.to && (!c.posted || c.posted > f.to)) return false;
      return true;
    });

    return list.sort((a, b) => {
      switch (this.sortKey) {
        case 'deadline':
          return a.deadline.localeCompare(b.deadline);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return (b.posted ?? '').localeCompare(a.posted ?? ''); // Most Relevant
      }
    });
  }

  get pagedCards(): GrantCardData[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCards.slice(start, start + this.pageSize);
  }

  // Jo grant select hai. Na mile to current page ki pehli grant
  get selected(): GrantCardData | null {
    const page = this.pagedCards;
    return page.find((c) => c.id === this.selectedId) ?? page[0] ?? null;
  }

  // Filters button par badge
  get activeFilterCount(): number {
    const f = this.applied;
    return [f.state, f.area, f.from, f.to].filter(Boolean).length;
  }

  /* =====================================================
     DETAIL PANEL ke helpers
     ===================================================== */
  // 10 din ke andar band hone wala
  isClosingSoon(g: GrantCardData): boolean {
    const diff = new Date(g.deadline).getTime() - new Date(this.today).getTime();
    return Math.round(diff / 86400000) <= 10;
  }

  eligibilityOf(g: GrantCardData): string[] {
    return g.eligibility?.length ? g.eligibility : IND_ELIGIBILITY;
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

  // Details se wapas list par
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
    this.filtersOpen = false; // mobile par filter bar band
  }

  onReset(): void {
    this.draft = { state: '', area: '', from: '', to: '' };
    this.applied = { ...this.draft };
    this.currentPage = 1;
  }

  onAdvanced(): void {
    console.log('Advanced Search'); // TODO: advanced search page ka route
  }

  onSort(v: SortKey): void {
    this.sortKey = v;
    this.currentPage = 1;
  }

  onSelect(g: GrantCardData): void {
    this.selectedId = g.id;
    this.detailOpen = true; // desktop par CSS isko ignore karta hai

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
