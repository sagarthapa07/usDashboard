import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { SampleProposal, SampleProposalTagColor } from '../../../datatype';
import {
  MOCK_SAMPLE_PROPOSALS,
  SP_AREA_ICONS,
  SP_DEFAULT_ICON,
  SP_MAIN_AREAS,
  SP_PAGE_SIZE,
  SP_PAGE_TEXT,
  SP_ROUTE_DETAIL,
  SP_TAG_COLORS,
} from '../../core/mock-data'; // <-- apne mock-data.ts ka sahi path rakhna
import { Pagination } from '../../shared/pagination/pagination'; // <-- Advanced Search me jahan se app-pagination aa raha hai wahi path/class naam rakhna

@Component({
  selector: 'app-sample-proposals',
  standalone: true,
  imports: [DatePipe, Pagination],
  templateUrl: './sample-proposal.html',
  styleUrl: './sample-proposal.scss',
})
export class SampleProposals implements OnInit {
  private router = inject(Router);

  @ViewChild('countEl') countEl?: ElementRef<HTMLElement>;
  @ViewChild('areaSearchEl') areaSearchEl?: ElementRef<HTMLInputElement>;

  readonly text = SP_PAGE_TEXT;
  readonly mainAreas = SP_MAIN_AREAS;

  // ----- State -----
  loading = signal(true);
  proposals = signal<SampleProposal[]>([]);
  query = signal('');
  selected = signal<Set<string>>(new Set());
  page = signal(1);
  pageSize = signal(SP_PAGE_SIZE);

  areaOpen = signal(false);
  areaQuery = signal('');
  moreOpen = signal(false);

  inDownloadList = signal<Set<number | string>>(new Set());

  // ----- Derived data -----
  extraAreas = computed(() => {
    const uniq = Array.from(new Set(this.proposals().map((p) => p.area)));
    return uniq.filter((a) => !this.mainAreas.includes(a)).sort((a, b) => a.localeCompare(b));
  });

  allAreas = computed(() =>
    Array.from(new Set([...this.mainAreas, ...this.extraAreas()])).sort((a, b) => a.localeCompare(b)),
  );

  visibleAreas = computed(() => {
    const q = this.areaQuery().trim().toLowerCase();
    return this.allAreas().filter((a) => a.toLowerCase().includes(q));
  });

  allVisibleChecked = computed(() => {
    const list = this.visibleAreas();
    return list.length > 0 && list.every((a) => this.selected().has(a));
  });

  areaLabel = computed(() => {
    const n = this.selected().size;
    if (!n) return this.text.areaAll;
    if (n === 1) return Array.from(this.selected())[0];
    return `${n} ${this.text.areasSelectedSuffix}`;
  });

  singleSelected = computed(() => (this.selected().size === 1 ? Array.from(this.selected())[0] : ''));
  singleInExtra = computed(() => this.extraAreas().includes(this.singleSelected()));

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const sel = this.selected();
    return this.proposals().filter(
      (p) => (!sel.size || sel.has(p.area)) && (!q || `${p.title} ${p.area}`.toLowerCase().includes(q)),
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));

  // page ko hamesha valid range me rakhta hai (filter badalne par)
  currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  paged = computed(() => {
    const size = this.pageSize();
    const start = (this.currentPage() - 1) * size;
    return this.filtered().slice(start, start + size);
  });

  ngOnInit(): void {
    // Abhi API nahi hai, isliye mock data se load kar rahe hain.
    this.proposals.set(MOCK_SAMPLE_PROPOSALS);
    this.loading.set(false);
  }

  // ----- Search -----
  onSearch(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  // ----- Area filter -----
  toggleAreaMenu(e: Event): void {
    e.stopPropagation();
    const open = !this.areaOpen();
    this.areaOpen.set(open);
    this.moreOpen.set(false);
    if (open) setTimeout(() => this.areaSearchEl?.nativeElement.focus({ preventScroll: true }));
  }

  toggleArea(area: string, checked: boolean): void {
    const next = new Set(this.selected());
    if (checked) next.add(area);
    else next.delete(area);
    this.selected.set(next);
    this.page.set(1);
  }

  toggleAllVisible(checked: boolean): void {
    const next = new Set(this.selected());
    this.visibleAreas().forEach((a) => (checked ? next.add(a) : next.delete(a)));
    this.selected.set(next);
    this.page.set(1);
  }

  pickPill(area: string): void {
    this.selected.set(area ? new Set([area]) : new Set());
    this.moreOpen.set(false);
    this.page.set(1);
  }

  toggleMore(e: Event): void {
    e.stopPropagation();
    this.moreOpen.set(!this.moreOpen());
    this.areaOpen.set(false);
  }

  resetFilters(): void {
    this.query.set('');
    this.selected.set(new Set());
    this.page.set(1);
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.areaOpen.set(false);
    this.moreOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus();
  }

  // ----- Pagination (app-pagination se) -----
  onPageChange(n: number): void {
    this.page.set(n);
    this.countEl?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  // ----- Card helpers -----
  iconFor(area: string): string {
    return SP_AREA_ICONS[area] ?? SP_DEFAULT_ICON;
  }

  tagColor(area: string): SampleProposalTagColor {
    const sum = Array.from(area).reduce((a, c) => a + c.charCodeAt(0), 0);
    return SP_TAG_COLORS[sum % SP_TAG_COLORS.length];
  }

  // ----- Actions -----
  viewProposal(p: SampleProposal): void {
    this.router.navigate([SP_ROUTE_DETAIL, p.id]);
  }

  toggleDownloadList(p: SampleProposal): void {
    const next = new Set(this.inDownloadList());
    if (next.has(p.id)) next.delete(p.id);
    else next.add(p.id);
    this.inDownloadList.set(next);
    // TODO: download-list store / API ban jaye to yahan add/remove call karna
  }

  openTutorial(e: Event): void {
    e.preventDefault();
    if (!this.text.tutorialUrl) return;
    window.open(this.text.tutorialUrl, '_blank', 'noopener');
  }
}