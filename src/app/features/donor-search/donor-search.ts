import { DatePipe, DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Buttons } from '../../shared/buttons/buttons';
import { DonorFilter } from '../../shared/donor-filter/donor-filter';
import {
  DonorChip,
  DonorChipKey,
  DonorFilterValue,
  DonorItem,
  DonorPopularSearch,
  DonorSortKey,
} from '../../../datatype';
import {
  DONOR_AREA_LIST,
  DONOR_COLORS,
  DONOR_COUNTRIES,
  DONOR_DEFAULT_PAGE_SIZE,
  DONOR_FOCUS_COUNTRIES,
  DONOR_PAGE_SIZES,
  DONOR_PAGE_TEXT,
  DONOR_POPULAR,
  DONOR_SORT_OPTIONS,
  MOCK_DONOR_LIST,
  MOCK_SAVED_DONOR_IDS,
} from '../../core/mock-data';

interface PageButton {
  label: string;
  page: number | null; // null = "…"
}

@Component({
  selector: 'app-donor-search',
  imports: [DatePipe, FormsModule, Buttons, DonorFilter],
  templateUrl: './donor-search.html',
  styleUrl: './donor-search.scss',
})
export class DonorSearch {
  /* ----- Static data (mock-data se) ----- */
  text = DONOR_PAGE_TEXT;
  sortOptions = DONOR_SORT_OPTIONS;
  pageSizes = DONOR_PAGE_SIZES;
  countries = DONOR_COUNTRIES;
  focuses = DONOR_FOCUS_COUNTRIES;
  areas = DONOR_AREA_LIST;
  popular = DONOR_POPULAR;

  donors = signal<DonorItem[]>(MOCK_DONOR_LIST);
  saved = signal<Set<number>>(new Set(MOCK_SAVED_DONOR_IDS));

  keyword = signal('');
  filter = signal<DonorFilterValue>({ countries: [], focuses: [], areas: [] });
  savedOnly = signal(false);
  sort = signal<DonorSortKey>('newest');
  view = signal<'list' | 'grid'>('grid');
  page = signal(1);
  pageSize = signal(DONOR_DEFAULT_PAGE_SIZE);

  /* ----- Drawer ----- */
  drawerOpen = signal(false);
  drawerMode = signal<'donor' | 'tutorial'>('donor');
  activeDonor = signal<DonorItem | null>(null);
  copied = signal(false);

  /* ----- Filter + sort ----- */
  filtered = computed(() => {
    const q = this.keyword().trim().toLowerCase();
    const f = this.filter();
    const saved = this.saved();
    const onlySaved = this.savedOnly();

    const list = this.donors().filter(
      (d) =>
        (!f.countries.length || f.countries.includes(d.country)) &&
        (!f.focuses.length || f.focuses.includes(d.focus)) &&
        (!f.areas.length || d.areas.some((a) => f.areas.includes(a))) &&
        (!onlySaved || saved.has(d.id)) &&
        `${d.name} ${d.country} ${d.areas.join(' ')}`.toLowerCase().includes(q),
    );

    switch (this.sort()) {
      case 'az':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'za':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'country':
        return list.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
      default:
        return list.sort((a, b) => (a.posted < b.posted ? 1 : a.posted > b.posted ? -1 : a.id - b.id));
    }
  });

  /* ----- Pagination ----- */
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());
  pageItems = computed(() => this.filtered().slice(this.startIndex(), this.startIndex() + this.pageSize()));

  rangeFrom = computed(() => this.startIndex() + 1);
  rangeTo = computed(() => Math.min(this.startIndex() + this.pageSize(), this.filtered().length));

  pageButtons = computed<PageButton[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const out: PageButton[] = [];
    for (let i = 1; i <= total; i++) {
      if (i <= 3 || i === total || Math.abs(i - current) < 1) {
        out.push({ label: String(i), page: i });
      } else if (out[out.length - 1]?.page !== null) {
        out.push({ label: '…', page: null });
      }
    }
    return out;
  });

  /* ----- Active filter chips ----- */
  chips = computed<DonorChip[]>(() => {
    const f = this.filter();
    const list: DonorChip[] = [];
    if (this.keyword().trim()) list.push({ key: 'keyword', label: `Keyword: ${this.keyword().trim()}` });
    if (f.countries.length) list.push({ key: 'countries', label: `Donor: ${f.countries.join(', ')}` });
    if (f.focuses.length) list.push({ key: 'focuses', label: `Focus: ${f.focuses.join(', ')}` });
    if (f.areas.length) list.push({ key: 'areas', label: f.areas.join(', ') });
    if (this.savedOnly()) list.push({ key: 'saved', label: 'Saved only' });
    return list;
  });

  /* ----- Drawer: milte-julte donors ----- */
  similarDonors = computed(() => {
    const d = this.activeDonor();
    if (!d) return [];
    return this.donors()
      .filter((x) => x.id !== d.id && x.areas.some((a) => d.areas.includes(a)))
      .slice(0, 3);
  });

  constructor(
    private host: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private doc: Document,
  ) {}

  /* ---------- Helpers (template me use) ---------- */
  initials(name: string): string {
    return name
      .replace(/[^A-Za-z ]/g, '')
      .split(' ')
      .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  color(d: DonorItem): string {
    const key = d.areas[0] ?? d.name;
    return DONOR_COLORS[(key.charCodeAt(0) + key.charCodeAt(1)) % DONOR_COLORS.length];
  }

  shortUrl(url: string): string {
    return url.replace(/^https?:\/\//, '');
  }

  isSaved(id: number): boolean {
    return this.saved().has(id);
  }

  /* ---------- Search + filters ---------- */
  setKeyword(value: string): void {
    this.keyword.set(value ?? '');
    this.page.set(1);
  }

  applyFilter(value: DonorFilterValue): void {
    this.filter.set(value);
    this.page.set(1);
  }

  pickPopular(p: DonorPopularSearch): void {
    this.keyword.set('');
    this.savedOnly.set(false);
    this.filter.set({ countries: [], focuses: [], areas: [p.area] });
    this.page.set(1);
  }

  removeChip(key: DonorChipKey): void {
    if (key === 'keyword') this.keyword.set('');
    else if (key === 'saved') this.savedOnly.set(false);
    else this.filter.update((f) => ({ ...f, [key]: [] }));
    this.page.set(1);
  }

  resetAll(): void {
    this.keyword.set('');
    this.savedOnly.set(false);
    this.filter.set({ countries: [], focuses: [], areas: [] });
    this.page.set(1);
  }

  /* ---------- Toolbar ---------- */
  toggleSavedOnly(): void {
    this.savedOnly.update((v) => !v);
    this.page.set(1);
  }

  setSort(key: DonorSortKey): void {
    this.sort.set(key);
    this.page.set(1);
  }

  setView(v: 'list' | 'grid'): void {
    this.view.set(v);
  }

  /* ---------- Save (heart) ---------- */
  toggleSaved(id: number, event?: Event): void {
    event?.stopPropagation();
    // Api aane par: this.api.toggleSavedDonor(id)
    this.saved.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /* ---------- Pagination ---------- */
  goTo(value: number | string | null): void {
    const n = Number(value);
    if (!n || n < 1) return;
    this.page.set(Math.min(n, this.totalPages()));
    this.scrollToTop();
  }

  setPageSize(size: number | string): void {
    this.pageSize.set(Number(size));
    this.page.set(1);
  }

  private scrollToTop(): void {
    const el = this.host.nativeElement;
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------- Drawer ---------- */
  openDonor(d: DonorItem): void {
    this.activeDonor.set(d);
    this.drawerMode.set('donor');
    this.drawerOpen.set(true);
    this.copied.set(false);
  }

  openTutorial(): void {
    this.drawerMode.set('tutorial');
    this.drawerOpen.set(true);
  }

  @HostListener('document:keydown.escape')
  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  copyLink(url: string): void {
    const clipboard = this.doc.defaultView?.navigator?.clipboard;
    clipboard?.writeText(url).catch(() => {});
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}