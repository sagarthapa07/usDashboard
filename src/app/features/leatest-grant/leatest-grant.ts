import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownItem, GrantCardData, SortKey, SortOption } from '../../../datatype';
import {
  DEFAULT_ELIGIBILITY,
  LATEST_SORT_OPTIONS,
  MOCK_AREAS,
  MOCK_LATEST_GRANTS,
  MOCK_STATES,
} from '../../core/mock-data';
import { Table } from '../../layout/table/table';
import { Pagination } from '../../shared/pagination/pagination';
import { Buttons } from '../../shared/buttons/buttons';
import { Router } from '@angular/router';

// Filter bar ki values
interface LatestFilter {
  state: string;
  area: string;
  from: string;
  to: string;
}

@Component({
  selector: 'app-leatest-grant',
  imports: [FormsModule, DatePipe, Table, Pagination, Buttons],
  templateUrl: './leatest-grant.html',
  styleUrl: './leatest-grant.scss',
})
export class LeatestGrant {

  constructor(private router: Router) {}
  /* =====================================================
     DATA: mock-data.ts se (baad me API se aayega)
     ===================================================== */
  sortOptions: SortOption[] = LATEST_SORT_OPTIONS;
  states: DropdownItem[] = MOCK_STATES;
  areas: DropdownItem[] = MOCK_AREAS;
  cards: GrantCardData[] = structuredClone(MOCK_LATEST_GRANTS);

  /* =====================================================
     PAGE KI STATE
     ===================================================== */
  // draft = abhi form me jo chun rahe ho, applied = Search dabane ke baad wali
  draft: LatestFilter = { state: '', area: '', from: '', to: '' };
  applied: LatestFilter = { state: '', area: '', from: '', to: '' };

  sortKey: SortKey = 'newest';
  selectedId: number | string | null = null;

  currentPage = 1;
  pageSize = 10;

  /* =====================================================
     MOBILE STATE (sirf mobile par asar karta hai, CSS se)
     filtersOpen = Filters button dabane par filter bar khula hai
     detailOpen  = grant par tap kiya, ab sirf details dikh rahi hain
     ===================================================== */
  filtersOpen = false;
  detailOpen = false;

  // Back dabane par list wahin dikhane ke liye scroll yaad rakhte hain
  private listScroll = 0;

  /* =====================================================
     FILTER + SORT + PAGINATION
     ===================================================== */
  private get today(): string {
    return new Date().toISOString().slice(0, 10);
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
          return (b.posted ?? '').localeCompare(a.posted ?? ''); // newest first
      }
    });
  }

  get pagedCards(): GrantCardData[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCards.slice(start, start + this.pageSize);
  }

  // Jo grant select hai. Na mile to current page ki pehli grant (design jaisa)
  get selected(): GrantCardData | null {
    const page = this.pagedCards;
    return page.find((c) => c.id === this.selectedId) ?? page[0] ?? null;
  }

  // Filters button par badge: kitne filter lage hain
  get activeFilterCount(): number {
    const f = this.applied;
    return [f.state, f.area, f.from, f.to].filter(Boolean).length;
  }

  /* =====================================================
     DETAIL PANEL ke helpers
     ===================================================== */
  // Deadline me kitne din bache hain
  daysLeft(g: GrantCardData): number {
    const diff = new Date(g.deadline).getTime() - new Date(this.today).getTime();
    return Math.max(0, Math.round(diff / 86400000));
  }

  leftLabel(g: GrantCardData): string {
    const d = this.daysLeft(g);
    if (d === 0) return 'Today';
    return d === 1 ? '1 day' : `${d} days`;
  }

  // 10 din ke andar band hone wala
  isClosingSoon(g: GrantCardData): boolean {
    return this.daysLeft(g) <= 10;
  }

  // Donor ka type: US Federal / Private Foundation
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
  // Abhi mobile layout chal raha hai ya nahi (CSS ke 900px ke saath same)
  private get isMobile(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  // Details se wapas list par
  closeDetail(): void {
    this.detailOpen = false;

    // List dikhne ke baad purani scroll jagah par jao
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

  onAlert(g: GrantCardData): void {
    console.log('Set alert:', g);
  }
}