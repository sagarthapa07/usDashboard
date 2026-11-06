import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertGrantFilters,
  AlertGrantSort,
  AlertGrantSortOption,
  AlertGrantsPageText,
  GrantCardData,
} from '../../../datatype';
import {
  AG_AREA_CATEGORY_MAP,
  AG_EMPTY_FILTERS,
  AG_PAGE_SIZE,
  AG_PAGE_TEXT,
  AG_ROUTE_DETAIL,
  AG_ROUTE_EDIT,
  AG_SORT_OPTIONS,
  DEFAULT_ELIGIBILITY,
  MOCK_ADV_GRANTS,
  MOCK_FA_SETTINGS,
} from '../../core/mock-data';
import { Table } from '../../layout/table/table';
import { Pagination } from '../../shared/pagination/pagination';
import { Buttons } from '../../shared/buttons/buttons';

@Component({
  selector: 'app-alert-grants',
  imports: [FormsModule, DatePipe, Table, Pagination, Buttons],
  templateUrl: './alert-grants.html',
  styleUrl: './alert-grants.scss',
})
export class AlertGrants implements OnInit {
  constructor(private router: Router) {}

  /* =====================================================
     DATA: mock-data.ts se (baad me API se aayega)
     ===================================================== */
  readonly text: AlertGrantsPageText = AG_PAGE_TEXT;
  sortOptions: AlertGrantSortOption[] = AG_SORT_OPTIONS;
  cards: GrantCardData[] = structuredClone(MOCK_ADV_GRANTS);

  // Funding Alerts me user ne jo states / areas save kiye
  // Baad me: this.api.getFundingAlerts() se aayenge
  myStates: string[] = [];
  myAreas: string[] = [];

  /* =====================================================
     PAGE KI STATE
     ===================================================== */
  // draft = abhi form me jo chun rahe ho, applied = Search dabane ke baad wali
  draft: AlertGrantFilters = { ...AG_EMPTY_FILTERS };
  applied: AlertGrantFilters = { ...AG_EMPTY_FILTERS };

  sortKey: AlertGrantSort = 'newest';
  selectedId: number | string | null = null;

  results: GrantCardData[] = []; // filter + sort ke baad ki poori list
  currentPage = 1;
  pageSize = AG_PAGE_SIZE;

  /* =====================================================
     MOBILE STATE (Latest Grants jaisa)
     ===================================================== */
  filtersOpen = false;
  detailOpen = false;
  private listScroll = 0;

  ngOnInit(): void {
    this.myStates = [...MOCK_FA_SETTINGS.states];
    this.myAreas = [...MOCK_FA_SETTINGS.areas];
    this.refresh();
  }

  /* =====================================================
     MATCHING + FILTER + SORT
     ===================================================== */
  private get today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // Is grant ki category kaun se alert areas me aati hai
  matchedAreas(g: GrantCardData): string[] {
    const areas = this.applied.area ? [this.applied.area] : this.myAreas;
    return areas.filter((a) => (AG_AREA_CATEGORY_MAP[a] ?? []).includes(g.category));
  }

  // Ek hi baar calculate hota hai (search / sort / reset par), har change detection par nahi
  private refresh(): void {
    const f = this.applied;

    const list = this.cards.filter((c) => {
      if (c.deadline && c.deadline < this.today) return false; // nikal chuke grants nahi dikhane ('' = Ongoing dikhega)
      if (!this.matchedAreas(c).length) return false;

      if (f.state) {
        if (c.state !== f.state) return false;
      } else if (this.myStates.length && !this.myStates.includes(c.state)) {
        return false;
      }

      if (f.from && (!c.posted || c.posted < f.from)) return false;
      if (f.to && (!c.posted || c.posted > f.to)) return false;
      return true;
    });

    this.results = list.sort((a, b) => {
      switch (this.sortKey) {
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1; // Ongoing sabse neeche
          if (!b.deadline) return -1;
          return a.deadline.localeCompare(b.deadline);
        case 'relevant': {
          const diff = this.matchedAreas(b).length - this.matchedAreas(a).length;
          if (diff) return diff;
          return (b.posted ?? '').localeCompare(a.posted ?? '');
        }
        default:
          return (b.posted ?? '').localeCompare(a.posted ?? ''); // newest first
      }
    });
  }

  get pagedCards(): GrantCardData[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.results.slice(start, start + this.pageSize);
  }

  // Jo grant select hai. Na mile to current page ki pehli grant
  get selected(): GrantCardData | null {
    const page = this.pagedCards;
    return page.find((c) => c.id === this.selectedId) ?? page[0] ?? null;
  }

  get activeFilterCount(): number {
    const f = this.applied;
    return [f.state, f.area, f.from, f.to].filter(Boolean).length;
  }

  /* =====================================================
     DETAIL PANEL ke helpers
     ===================================================== */
  daysLeft(g: GrantCardData): number {
    const diff = new Date(g.deadline).getTime() - new Date(this.today).getTime();
    return Math.max(0, Math.round(diff / 86400000));
  }

  leftLabel(g: GrantCardData): string {
    if (!g.deadline) return 'Ongoing';
    const d = this.daysLeft(g);
    if (d === 0) return 'Today';
    return d === 1 ? '1 day' : `${d} days`;
  }

  isClosingSoon(g: GrantCardData): boolean {
    return !!g.deadline && this.daysLeft(g) <= 10;
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
    this.refresh();
  }

  onReset(): void {
    this.draft = { ...AG_EMPTY_FILTERS };
    this.applied = { ...AG_EMPTY_FILTERS };
    this.currentPage = 1;
    this.refresh();
  }

  onSort(v: AlertGrantSort): void {
    this.sortKey = v;
    this.currentPage = 1;
    this.refresh();
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

  // Edit alert settings / Set up Funding Alerts => Funding Alerts page
  editAlerts(): void {
    this.router.navigate([AG_ROUTE_EDIT]);
  }

  onView(g: GrantCardData): void {
    this.router.navigate([AG_ROUTE_DETAIL, g.id]);
  }
}