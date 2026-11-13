import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  DropdownItem,
  GrantCardData,
  LatestGrantApiItem,
  SortKey,
  SortOption,
} from '../../../datatype';
import { LATEST_SORT_OPTIONS } from '../../core/mock-data';
import { Api } from '../../core/api';
import { Table } from '../../layout/table/table';
import { Pagination } from '../../shared/pagination/pagination';
import { Buttons } from '../../shared/buttons/buttons';
import { FilterDropdown } from '../../shared/filter-dropdown/filter-dropdown';
import { DatePicker } from '../../shared/date-picker/date-picker';

interface LatestFilter {
  state: DropdownItem[];
  area: DropdownItem[];
  from: string;
  to: string;
}

// Side panel me jo dikhana hai (API response se normalize hoke aata hai)
interface GrantDetailView {
  title: string;
  image: string;
  intro: string;
  contentHtml: string;
  amount: string;
  type: string;
  duration: string;
  donor: string;
  focus: string;
  locationLabel: string;
  locationFull: string;
  posted: string; // ISO
  deadline: string; // ISO ('' = ongoing)
  ongoing: boolean;
  linkUrl: string;
  eligibility: string[];
}

@Component({
  selector: 'app-leatest-grant',
  imports: [FormsModule, DatePipe, Table, Pagination, Buttons, FilterDropdown, DatePicker],
  templateUrl: './leatest-grant.html',
  styleUrl: './leatest-grant.scss',
})
export class LeatestGrant implements OnInit {
  constructor(
    private router: Router,
    private api: Api,
    private cdr: ChangeDetectorRef,
  ) {}

  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // TODO: logged-in user se lena
  private readonly memberId = 139118;
  private readonly userIp = '115.247.76.82';
  private readonly memberKey = 'q4kvSpcHhvH7Ldy5EfUsZA||';

  private readonly tones = [
    'blue',
    'red',
    'indigo',
    'gold',
    'pink',
    'slate',
    'green',
    'purple',
    'teal',
    'orange',
  ];

  sortOptions: SortOption[] = LATEST_SORT_OPTIONS;

  // List
  cards: GrantCardData[] = [];
  totalItems = 0;
  loading = false;
  error = '';

  // Filters
  draft: LatestFilter = { state: [], area: [], from: '', to: '' };
  applied: LatestFilter = { state: [], area: [], from: '', to: '' };
  sortKey: SortKey = 'newest';
  currentPage = 1;
  pageSize = 10;
  filtersOpen = false;

  // Selection + detail
  selectedId: number | string | null = null;
  detailOpen = false;
  detail: GrantDetailView | null = null;
  detailLoading = false;
  detailError = false;
  private detailCache = new Map<number | string, GrantDetailView>();

  private listScroll = 0;

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadGrants();
    }
  }

  /* =====================================================
     LIST API
     ===================================================== */
  loadGrants(): void {
    const f = this.applied;
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.api
      .getLatestGrants({
        pageIndex: this.currentPage,
        pageSize: this.pageSize,
        userIp: this.userIp,
        memberId: this.memberKey,
        platform: 'NEW',
        viewType: 'LOCAL',
        countries: f.state.map((s) => s.id),
        issues: f.area.map((a) => a.id),
        fromDate: f.from || null,
        toDate: f.to || null,
      })
      .subscribe({
        next: (res) => {
          this.cards = (res.grants ?? []).map((g) => this.mapGrant(g));
          this.totalItems = res.pageCount * this.pageSize;
          this.loading = false;

          // Naye page par pehli grant select + uski detail load
          this.selectedId = this.pagedCards[0]?.id ?? null;
          this.detail = null;
          this.loadDetail(this.selected);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('List API error:', err);
          this.cards = [];
          this.totalItems = 0;
          this.selectedId = null;
          this.detail = null;
          this.error = 'Grants load nahi ho paye. Dubara try karo.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private toType(category: string): GrantCardData['type'] {
    const known = ['Grant', 'Program', 'Fellowship', 'Scholarship'] as const;
    return known.find((k) => k.toLowerCase() === category.trim().toLowerCase()) ?? 'Grant';
  }

  private mapGrant(g: LatestGrantApiItem): GrantCardData {
    return {
      id: g.id,
      title: g.title.trim(),
      donor: g.donorAgency.trim(),
      amount: g.grantSize,
      type: this.toType(g.category),
      category: g.category,
      state: this.stateFromTitle(g.title),
      posted: this.toIso(g.posted),
      deadline: this.toIso(g.deadline),
      image: g.image,
      url: g.url,
      isNew: this.isToday(g.posted),
      isFav: false,
      icon: 'bi-geo-alt',
      tone: this.tones[Number(g.id) % this.tones.length],
    };
  }

  /* =====================================================
     DETAIL API
     ===================================================== */
  // "/opportunity/us-op/Some-Title" -> "Some-Title"
  private friendlyUrl(url?: string): string {
    return (url ?? '').split('?')[0].split('/').filter(Boolean).pop() ?? '';
  }

  loadDetail(g: GrantCardData | null): void {
    if (!g || !this.isBrowser) return;

    const cached = this.detailCache.get(g.id);
    if (cached) {
      this.detail = cached;
      this.detailLoading = false;
      this.detailError = false;
      this.cdr.markForCheck();
      return;
    }

    const friendlyURL = this.friendlyUrl(g.url);
    if (!friendlyURL) {
      console.warn('Detail: friendlyURL empty, g.url =', g.url);
      this.detail = null;
      this.detailLoading = false;
      this.detailError = true;
      this.cdr.markForCheck();
      return;
    }

    const payload = { friendlyURL, memberId: this.memberId, referenceId: 0 };

    this.detail = null;
    this.detailLoading = true;
    this.detailError = false;
    this.cdr.markForCheck();

    this.api.getUsGrantDetail(payload).subscribe({
      next: (res) => {
        if (this.selected?.id !== g.id) return;

        console.log('Detail response:', res);

        try {
          // res.result ho ya interceptor ne already unwrap kar diya ho, dono chalega
          const wrapped = res?.result ? res : res?.grantTitle ? { result: res } : res;
          const view = this.mapDetail(wrapped);
          if (view) {
            this.detailCache.set(g.id, view);
            this.detail = view;
            this.detailError = false;
          } else {
            console.error('Detail: result missing, res =', res);
            this.detailError = true;
          }
        } catch (e) {
          console.error('Detail: mapDetail crashed:', e, res);
          this.detailError = true;
        }

        this.detailLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Detail API error:', {
          status: err?.status,
          body: err?.error,
          payload,
          listUrl: g.url,
        });
        if (this.selected?.id !== g.id) return;
        this.detailError = true;
        this.detailLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private mapDetail(res: any): GrantDetailView | null {
    const r = res?.result;
    if (!r) return null;

    // Pehle grantStates (array) se, nahi to purani statestring se
    const stateNames: string[] = (r.grantStates ?? []).map((s: any) => s.stateName).filter(Boolean);
    const cityNames: string[] = (r.grantCities ?? []).map((c: any) => c.cityName).filter(Boolean);
    const fromString = this.parseStates(r.statestring, r.stcttype);

    let locationLabel = fromString.label;
    let locationFull = fromString.full;
    if (stateNames.length) {
      const head = stateNames.slice(0, 3).join(', ');
      const more = stateNames.length > 3 ? ` +${stateNames.length - 3} more` : '';
      locationLabel = head + more;
      locationFull = [...cityNames, ...stateNames].join(', ');
    }

    const contentHtml: string = r.grantContent ?? '';
    const intro = (r.shortIntro ?? '').trim() || this.stripHtml(contentHtml).slice(0, 300);

    return {
      title: (r.grantTitle ?? '').trim(),
      image: r.grantLogoImage ?? '',
      intro,
      contentHtml,
      amount: r.grantSize || 'Not Available',
      type: r.grantType || 'Grant',
      duration: /not mentioned/i.test(r.grantDuration ?? '') ? '' : (r.grantDuration ?? ''),
      donor: (r.donorAgency ?? '').trim(),
      focus: (r.urlData?.metaKeywords ?? '').trim(),
      locationLabel,
      locationFull,
      posted: this.toIso(r.postDate ?? ''),
      deadline: r.onGoingGrants === 1 ? '' : this.toIso(r.deadLineDate ?? ''),
      ongoing: r.onGoingGrants === 1,
      linkUrl: r.linkUrl ?? '',
      eligibility: this.extractEligibility(contentHtml),
    };
  }

  // "[Alabama]-[Alaska]..." -> label ("All States" / "Texas, Ohio +3 more")
  private parseStates(stateString?: string, type?: string): { label: string; full: string } {
    const list = (stateString ?? '')
      .split(']-[')
      .map((s) => s.replace(/[\[\]]/g, '').trim())
      .filter(Boolean);

    if ((type ?? '').toUpperCase().includes('ALL STATES') || list.length >= 50) {
      return { label: 'All States', full: list.join(', ') };
    }
    if (!list.length) return { label: 'USA', full: '' };

    const head = list.slice(0, 3).join(', ');
    const more = list.length > 3 ? ` +${list.length - 3} more` : '';
    return { label: head + more, full: list.join(', ') };
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // grantContent me "Requirements" / "Eligibility" heading ke neeche ki lines nikalna
  private extractEligibility(html: string): string[] {
    if (!html) return [];

    const blocks = [...html.matchAll(/<(p|li|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)]
      .map((m) => ({ tag: m[1].toLowerCase(), raw: m[2], text: this.stripHtml(m[2]) }))
      .filter((b) => b.text);

    const isHeading = (b: { tag: string; raw: string }) =>
      /^h[1-6]$/.test(b.tag) || /^\s*<(strong|b)\b[^>]*>[\s\S]*<\/(strong|b)>\s*$/i.test(b.raw);

    const start = blocks.findIndex(
      (b) => isHeading(b) && /(eligib|requirement|who can apply|who may apply)/i.test(b.text),
    );
    if (start < 0) return [];

    const out: string[] = [];
    for (let i = start + 1; i < blocks.length; i++) {
      if (isHeading(blocks[i])) break;
      if (/^(for more (information|details)|visit|click here)/i.test(blocks[i].text)) continue;
      out.push(blocks[i].text);
    }
    return out;
  }

  /* =====================================================
     HELPERS
     ===================================================== */
  // "November 13, 2026" -> "2026-11-13"
  private toIso(text: string): string {
    const d = new Date(`${text} 12:00:00`);
    if (isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private isToday(text: string): boolean {
    return this.toIso(text) === this.today;
  }

  private stateFromTitle(title: string): string {
    const m = title.match(/\(([^)]+)\)\s*$/) ?? title.match(/\s(?:in|-)\s+([A-Z][A-Za-z ]+)$/);
    return m ? m[1].trim() : 'USA';
  }

  // Local date (UTC se din ek idhar-udhar na ho)
  private get today(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  get pagedCards(): GrantCardData[] {
    return [...this.cards].sort((a, b) => {
      switch (this.sortKey) {
        case 'deadline':
          return a.deadline.localeCompare(b.deadline);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return (b.posted ?? '').localeCompare(a.posted ?? '');
      }
    });
  }

  get selected(): GrantCardData | null {
    const page = this.pagedCards;
    return page.find((c) => c.id === this.selectedId) ?? page[0] ?? null;
  }

  get activeFilterCount(): number {
    const f = this.applied;
    return [f.state.length, f.area.length, f.from, f.to].filter(Boolean).length;
  }

  // Detail ke hisaab se deadline (ongoing ho to '')
  deadlineOf(g: GrantCardData): string {
    return this.detail ? this.detail.deadline : g.deadline;
  }

  isOngoing(): boolean {
    return !!this.detail?.ongoing;
  }

  daysLeft(iso: string): number {
    if (!iso) return 0;
    const diff = new Date(iso).getTime() - new Date(this.today).getTime();
    return Math.max(0, Math.round(diff / 86400000));
  }

  isClosingSoon(g: GrantCardData): boolean {
    return !this.isOngoing() && this.daysLeft(this.deadlineOf(g)) <= 10;
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
    this.loadGrants();
  }

  onReset(): void {
    this.draft = { state: [], area: [], from: '', to: '' };
    this.applied = { ...this.draft };
    this.currentPage = 1;
    this.loadGrants();
  }

  onAdvanced(): void {
    console.log('Advanced Search');
  }

  onSort(v: SortKey): void {
    this.sortKey = v;
  }

  onSelect(g: GrantCardData): void {
    this.selectedId = g.id;
    this.detailOpen = true;
    this.loadDetail(g);

    if (this.isMobile) {
      this.listScroll = window.scrollY;
      window.scrollTo({ top: 0 });
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadGrants();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadGrants();
  }

  toggleSave(g: GrantCardData): void {
    g.isFav = !g.isFav;
  }

  onView(g: GrantCardData): void {
    this.router.navigate(['/grant', g.id]);
  }

  onApply(): void {
    if (this.detail?.linkUrl) {
      window.open(this.detail.linkUrl, '_blank', 'noopener');
    }
  }

  retryDetail(): void {
    this.loadDetail(this.selected);
  }
}
