import { Component, ElementRef, computed, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';

import {
  Webinar,
  WebinarCategory,
  WebinarCategoryKey,
  WebinarFilterKey,
  WebinarSortKey,
  WebinarStatus,
  WebinarStatusFilter,
} from '../../../datatype';
import {
  MOCK_WEBINARS,
  WEBINAR_CATEGORIES,
  WEBINAR_DEFAULT_PAGE_SIZE,
  WEBINAR_FEATURED_COUNT,
  WEBINAR_PAGE_TEXT,
  WEBINAR_ROUTE_DETAIL,
  WEBINAR_SORT_OPTIONS,
  WEBINAR_STATS,
  WEBINAR_STATUS_OPTIONS,
  getWebinarStart,
  getWebinarStatus,
} from '../../core/mock-data';
import { Pagination } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-webinars',
  imports: [DatePipe, NgTemplateOutlet, Pagination],
  templateUrl: './webinars.html',
  styleUrl: './webinars.scss',
})
export class Webinars {
  constructor(
    private router: Router,
    private host: ElementRef<HTMLElement>,
  ) {}

  // Text / config (sab mock-data.ts se)
  readonly text = WEBINAR_PAGE_TEXT;
  readonly categories = WEBINAR_CATEGORIES;
  readonly sortOptions = WEBINAR_SORT_OPTIONS;
  readonly statusOptions = WEBINAR_STATUS_OPTIONS;

  // Baad me Api se aayega: this.api.getWebinars()
  readonly webinars = signal<Webinar[]>(MOCK_WEBINARS.map((w) => ({ ...w })));
  readonly loading = signal(false);

  // Page ki state
  readonly category = signal<WebinarFilterKey>('all');
  readonly statusFilter = signal<WebinarStatusFilter>('all');
  readonly query = signal('');
  readonly sort = signal<WebinarSortKey>('newest');
  readonly page = signal(1);
  readonly pageSize = signal(WEBINAR_DEFAULT_PAGE_SIZE);

  // "Aaj" ek baar page khulte hi tay ho jaata hai
  private readonly now = Date.now();

  private readonly catMap = new Map<WebinarFilterKey, WebinarCategory>(
    WEBINAR_CATEGORIES.map((c) => [c.key, c]),
  );

  // Hero ke stats ("18 Webinars", "3 Upcoming", ...)
  readonly statCards = computed(() => {
    const list = this.webinars();
    const upcoming = list.filter((w) => this.statusOf(w) !== 'recorded').length;
    return WEBINAR_STATS.map((s) => ({
      ...s,
      title: s.title.replace('{count}', String(list.length)).replace('{upcoming}', String(upcoming)),
    }));
  });

  // Search + topic chip + status toggle + sort
  readonly filtered = computed(() => {
    const cat = this.category();
    const status = this.statusFilter();
    const q = this.query().trim().toLowerCase();

    const list = this.webinars().filter((w) => {
      if (cat !== 'all' && w.category !== cat) return false;
      if (status === 'upcoming' && this.statusOf(w) === 'recorded') return false;
      if (status === 'recorded' && this.statusOf(w) !== 'recorded') return false;
      if (!q) return true;
      const hay = (w.title + ' ' + this.getCat(w.category).label + ' ' + w.trainer.name).toLowerCase();
      return hay.includes(q);
    });

    return list.sort((a, b) => {
      switch (this.sort()) {
        case 'oldest':
          return getWebinarStart(a) - getWebinarStart(b);
        case 'az':
          return a.title.localeCompare(b.title);
        case 'shortest':
          return a.minutes - b.minutes || getWebinarStart(b) - getWebinarStart(a);
        default:
          return getWebinarStart(b) - getWebinarStart(a);
      }
    });
  });

  // Featured block sirf tab dikhta hai jab koi filter / search / sort laga na ho
  readonly hasFeatured = computed(
    () =>
      this.category() === 'all' &&
      this.statusFilter() === 'all' &&
      !this.query().trim() &&
      this.sort() === 'newest' &&
      this.filtered().length > WEBINAR_FEATURED_COUNT,
  );
  readonly featured = computed(() =>
    this.hasFeatured() ? this.filtered().slice(0, WEBINAR_FEATURED_COUNT) : [],
  );
  readonly rest = computed(() =>
    this.hasFeatured() ? this.filtered().slice(WEBINAR_FEATURED_COUNT) : this.filtered(),
  );

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.rest().length / this.pageSize())));
  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  readonly showFeatured = computed(() => this.featured().length > 0 && this.currentPage() === 1);
  readonly pageItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.rest().slice(start, start + this.pageSize());
  });
  readonly noResults = computed(() => this.filtered().length === 0);

  // "Showing x of y" me featured bhi gino
  readonly shownCount = computed(
    () => this.pageItems().length + (this.showFeatured() ? this.featured().length : 0),
  );

  /* ---------- helpers (template me use hote hain) ---------- */
  getCat(key: WebinarCategoryKey): WebinarCategory {
    return this.catMap.get(key) as WebinarCategory;
  }

  statusOf(w: Webinar): WebinarStatus {
    return getWebinarStatus(w, this.now);
  }

  badgeOf(w: Webinar): string {
    const s = this.statusOf(w);
    return s === 'upcoming'
      ? this.text.upcomingBadge
      : s === 'live'
        ? this.text.liveBadge
        : this.text.recordedBadge;
  }

  // Card ka colour theme (CSS variables)
  vars(c: WebinarCategory): Record<string, string> {
    return { '--c': c.color, '--t': c.tint, '--g1': c.from, '--g2': c.to };
  }

  summaryOf(w: Webinar): string {
    return w.summary || this.getCat(w.category).blurb;
  }

  /* ---------- filter actions ---------- */
  setCategory(key: WebinarFilterKey): void {
    this.category.set(key);
    this.page.set(1);
  }

  setStatus(key: WebinarStatusFilter): void {
    this.statusFilter.set(key);
    this.page.set(1);
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  onSort(value: string): void {
    this.sort.set(value as WebinarSortKey);
    this.page.set(1);
  }

  // shared <app-pagination> se aate hain
  goTo(p: number): void {
    this.page.set(p);
    this.host.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  /* ---------- actions ---------- */
  open(w: Webinar): void {
    this.router.navigate([WEBINAR_ROUTE_DETAIL, w.id]);
  }
}