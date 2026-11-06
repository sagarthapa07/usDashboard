import { DatePipe, NgClass } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  GrantCardData,
  SearchBarType,
  AdvancedFilterValue,
  SortKey,
  SearchBarValue,
} from '../../../datatype';
import {
  ADV_CLOSING_SOON_DAYS,
  ADV_GRANT_SIZES,
  ADV_PAGE,
  ADV_PAGE_SIZE,
  ADV_SORT_OPTIONS,
  MOCK_ADV_GRANTS,
  MOCK_AREAS,
  MOCK_DONORS,
  MOCK_SEARCH_TYPES,
  MOCK_STATES,
} from '../../core/mock-data';
import { AdvancedFilter } from '../../shared/advanced-filter/advanced-filter';
import { Pagination } from '../../shared/pagination/pagination';

/* Card ke icon tile + badge ka rang type se aata hai (design jaisa) */
const TYPE_VISUAL: Record<string, { icon: string; cls: string }> = {
  Grant: { icon: 'bi-currency-dollar', cls: 't-grant' },
  Program: { icon: 'bi-clipboard', cls: 't-program' },
  Fellowship: { icon: 'bi-mortarboard', cls: 't-fellowship' },
  Scholarship: { icon: 'bi-book', cls: 't-scholarship' },
};

interface SavedSearch {
  id: string;
  label: string;
  search: SearchBarValue;
  filters: AdvancedFilterValue;
}

const SAVED_KEY = 'advSavedSearches';

@Component({
  selector: 'app-advance-search',
  imports: [FormsModule, NgClass, DatePipe, AdvancedFilter, Pagination],
  templateUrl: './advance-search.html',
  styleUrl: './advance-search.scss',
})
export class AdvanceSearch {
  @ViewChild(AdvancedFilter) filterCmp?: AdvancedFilter;

  heading = ADV_PAGE;
  typeChips = MOCK_SEARCH_TYPES;
  sortOptions = ADV_SORT_OPTIONS;
  closingDays = ADV_CLOSING_SOON_DAYS;
  private sizeOpts = ADV_GRANT_SIZES;

  states = this.unique(MOCK_STATES);
  areas = this.unique(MOCK_AREAS);
  donors = this.unique(MOCK_DONORS);

  search: SearchBarValue = { keyword: '', type: 'all', closingSoon: false, includeExpired: false };
  applied: SearchBarValue = { ...this.search };
  filters: AdvancedFilterValue = {
    dateBy: 'post',
    from: '',
    to: '',
    states: [],
    areas: [],
    grantSizes: [],
    donors: [],
  };

  sortKey: SortKey = 'deadline';
  pageSize = ADV_PAGE_SIZE;
  page = 1;
  results: GrantCardData[] = [];
  saved = new Set<string>(); // bookmarked grants
  filtersOpenMobile = false;
  savedMsg = '';
  savedSearches: SavedSearch[] = this.loadSaved();

  constructor(private router: Router) {
    this.compute();
  }

  /* ---------- helpers ---------- */
  private unique<T extends { id: string | number }>(list: T[]): T[] {
    const seen = new Set<string>();
    return list.filter((x) => (seen.has(String(x.id)) ? false : (seen.add(String(x.id)), true)));
  }

  // Local date (toISOString India me raat ko din galat kar deta hai)
  private today(): string {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  private parseAmount(text: string): { min: number; max: number } | null {
    const t = (text || '').toLowerCase();
    if (!/\d/.test(t)) return null;
    const nums: number[] = [];
    const re = /\$?\s*([\d,]+(?:\.\d+)?)\s*(million|k\b)?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      let n = parseFloat(m[1].replace(/,/g, ''));
      if (m[2] === 'million') n *= 1_000_000;
      if (m[2] === 'k') n *= 1_000;
      if (!isNaN(n)) nums.push(n);
    }
    if (!nums.length) return null;
    if (t.includes('more than')) return { min: nums[0], max: Infinity };
    if (t.includes('up to')) return { min: 0, max: nums[0] };
    return { min: Math.min(...nums), max: Math.max(...nums) };
  }

  daysLeft(deadline: string): number | null {
    if (!deadline) return null;
    const ms =
      new Date(deadline + 'T00:00:00Z').getTime() - new Date(this.today() + 'T00:00:00Z').getTime();
    return Math.round(ms / 86_400_000);
  }

  isExpired(g: GrantCardData): boolean {
    const d = this.daysLeft(g.deadline);
    return d !== null && d < 0;
  }

  visual(g: GrantCardData) {
    return TYPE_VISUAL[g.type ?? 'Grant'] ?? TYPE_VISUAL['Grant'];
  }

  /* ---------- events ---------- */
  onFilterChange(f: AdvancedFilterValue): void {
    this.filters = f;
    this.page = 1;
    this.compute();
  }

  runSearch(): void {
    this.applied = { ...this.search };
    this.page = 1;
    this.compute();
  }

  setType(t: SearchBarType): void {
    this.search.type = t;
    this.runSearch();
  }

  toggleClosing(): void {
    this.search.closingSoon = !this.search.closingSoon;
    this.runSearch();
  }

  toggleExpired(): void {
    this.search.includeExpired = !this.search.includeExpired;
    this.runSearch();
  }

  onSortChange(): void {
    this.page = 1;
    this.compute();
  }

  resetAll(): void {
    this.search = { keyword: '', type: 'all', closingSoon: false, includeExpired: false };
    this.applied = { ...this.search };
    this.sortKey = 'deadline';
    this.page = 1;
    if (this.filterCmp) this.filterCmp.clearAll(); // filterChange emit karega => compute()
    else this.compute();
  }

  /* ---------- filtering + sorting ---------- */
  private compute(): void {
    const s = this.applied;
    const f = this.filters;
    const kw = s.keyword.trim().toLowerCase();
    const today = this.today();
    const picked = this.sizeOpts.filter((o) => f.grantSizes.includes(o.key));

    const list = MOCK_ADV_GRANTS.filter((g) => {
      if (kw) {
        const hay =
          `${g.title} ${g.donor} ${g.category} ${g.state} ${g.description ?? ''}`.toLowerCase();
        if (!kw.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      if (s.type !== 'all' && g.type !== s.type) return false;
      if (!s.includeExpired && g.deadline && g.deadline < today) return false;
      if (s.closingSoon) {
        const d = this.daysLeft(g.deadline);
        if (d === null || d < 0 || d > ADV_CLOSING_SOON_DAYS) return false;
      }
      if (f.from || f.to) {
        const val = f.dateBy === 'deadline' ? g.deadline : (g.posted ?? '');
        if (!val) return false;
        if (f.from && val < f.from) return false;
        if (f.to && val > f.to) return false;
      }
      if (f.states.length && !f.states.includes(g.state)) return false;
      if (f.areas.length && !f.areas.includes(g.category)) return false;
      if (f.donors.length && !f.donors.includes(g.donor)) return false;
      if (picked.length) {
        const r = this.parseAmount(g.amount);
        const ok = picked.some((o) =>
          o.unknown ? r === null : !!r && r.max >= o.min && r.min <= o.max,
        );
        if (!ok) return false;
      }
      return true;
    });

    this.results = [...list].sort((a, b) => {
      if (this.sortKey === 'title') return a.title.localeCompare(b.title);
      if (this.sortKey === 'deadline')
        return (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31');
      return (b.posted ?? '').localeCompare(a.posted ?? '');
    });
  }

  /* ---------- pagination ---------- */
  get paged(): GrantCardData[] {
    const start = (this.page - 1) * this.pageSize;
    return this.results.slice(start, start + this.pageSize);
  }

  onPageChange(p: number): void {
    this.page = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
  }

  /* ---------- card actions ---------- */
  toggleSave(g: GrantCardData, ev: Event): void {
    ev.stopPropagation();
    const k = String(g.id);
    if (this.saved.has(k)) this.saved.delete(k);
    else this.saved.add(k);
  }

  openGrant(g: GrantCardData): void {
    this.router.navigate(['/grant', g.id]);
  }

  /* ---------- saved searches ---------- */
  private loadSaved(): SavedSearch[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SAVED_KEY, JSON.stringify(this.savedSearches));
      }
    } catch {
      /* storage full / blocked: ignore */
    }
    // Baad me Api: this.api.saveSearch(...)
  }

  // Chip ka naam: jo jo lagaya hai uska short summary
  private describe(s: SearchBarValue, f: AdvancedFilterValue): string {
    const parts: string[] = [];
    if (s.keyword.trim()) parts.push(`"${s.keyword.trim()}"`);
    if (s.type !== 'all') parts.push(String(s.type));
    if (s.closingSoon) parts.push(`Closing in ${this.closingDays} days`);
    if (s.includeExpired) parts.push('Incl. expired');
    if (f.states.length)
      parts.push(f.states.length === 1 ? String(f.states[0]) : `${f.states.length} states`);
    if (f.areas.length)
      parts.push(f.areas.length === 1 ? String(f.areas[0]) : `${f.areas.length} areas`);
    if (f.donors.length)
      parts.push(f.donors.length === 1 ? String(f.donors[0]) : `${f.donors.length} donors`);
    if (f.grantSizes.length) parts.push(`${f.grantSizes.length} size`);
    if (f.from || f.to)
      parts.push(`${f.dateBy === 'deadline' ? 'Deadline' : 'Posted'} ${f.from || '…'} – ${f.to || '…'}`);
    return parts.join(' · ');
  }

  saveSearch(): void {
    // Jo keyword abhi likha hai wo bhi apply + save ho (Search dabana zaroori nahi)
    this.runSearch();

    const search = { ...this.applied };
    const filters = structuredClone(this.filters);
    const label = this.describe(search, filters);

    if (!label) {
      this.flash('Pehle koi keyword ya filter lagao, phir save karo');
      return;
    }
    if (this.savedSearches.some((x) => x.label === label)) {
      this.flash('Ye search pehle se saved hai');
      return;
    }

    this.savedSearches = [{ id: String(Date.now()), label, search, filters }, ...this.savedSearches];
    this.persist();
    this.flash('Search saved to Saved Searches');
  }

  applySaved(s: SavedSearch): void {
    this.search = { ...s.search };
    this.applied = { ...s.search };
    this.filters = structuredClone(s.filters);
    this.page = 1;
    this.compute();
  }

  removeSaved(s: SavedSearch, ev: Event): void {
    ev.stopPropagation();
    this.savedSearches = this.savedSearches.filter((x) => x.id !== s.id);
    this.persist();
  }

  private flash(msg: string): void {
    this.savedMsg = msg;
    setTimeout(() => (this.savedMsg = ''), 2500);
  }
}