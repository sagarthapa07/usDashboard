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
import { Ebook, SampleProposalTagColor } from '../../../datatype';
import {
  EB_AREA_ICONS,
  EB_DEFAULT_ICON,
  EB_MAIN_AREAS,
  EB_PAGE_SIZE,
  EB_PAGE_TEXT,
  EB_ROUTE_DETAIL,
  MOCK_EBOOKS,
  SP_TAG_COLORS,
} from '../../core/mock-data'; // <-- apne mock-data.ts ka sahi path rakhna
import { Pagination } from '../../shared/pagination/pagination'; // <-- Sample Proposals me jo path hai wahi

@Component({
  selector: 'app-ebooks',
  standalone: true,
  imports: [DatePipe, Pagination],
  templateUrl: './e-books.html',
  styleUrl: './e-books.scss',
})
export class Ebooks implements OnInit {
  private router = inject(Router);

  @ViewChild('countEl') countEl?: ElementRef<HTMLElement>;
  @ViewChild('areaSearchEl') areaSearchEl?: ElementRef<HTMLInputElement>;

  readonly text = EB_PAGE_TEXT;
  readonly mainAreas = EB_MAIN_AREAS;

  // ----- State -----
  loading = signal(true);
  ebooks = signal<Ebook[]>([]);
  query = signal('');
  selected = signal<Set<string>>(new Set());
  page = signal(1);
  pageSize = signal(EB_PAGE_SIZE);

  areaOpen = signal(false);
  areaQuery = signal('');
  moreOpen = signal(false);

  // ----- Derived data -----
  extraAreas = computed(() => {
    const uniq = Array.from(new Set(this.ebooks().map((b) => b.area)));
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
    return this.ebooks().filter(
      (b) =>
        (!sel.size || sel.has(b.area)) &&
        (!q || `${b.title} ${b.area} ${b.subArea}`.toLowerCase().includes(q)),
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
    // API aane par: this.api.getEbooks().subscribe({...}) se replace karna.
    this.ebooks.set(MOCK_EBOOKS);
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
    return EB_AREA_ICONS[area] ?? EB_DEFAULT_ICON;
  }

  tagColor(area: string): SampleProposalTagColor {
    const sum = Array.from(area).reduce((a, c) => a + c.charCodeAt(0), 0);
    return SP_TAG_COLORS[sum % SP_TAG_COLORS.length];
  }

  // ----- Actions -----
  viewEbook(b: Ebook): void {
    // Details page banne tak ye route nahi milega; EB_ROUTE_DETAIL mock-data me hai
    this.router.navigate([EB_ROUTE_DETAIL, b.id]);
  }

  downloadEbook(b: Ebook): void {
    // Real PDF ka link (pdfUrl) hoga to wahi khulega
    if (!b.pdfUrl) return;
    window.open(b.pdfUrl, '_blank', 'noopener');
  }
}