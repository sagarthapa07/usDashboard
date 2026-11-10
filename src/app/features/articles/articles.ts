import { Component, ElementRef, computed, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';

import {
  Article,
  ArticleCategory,
  ArticleCategoryKey,
  ArticleFilterKey,
  ArticleSortKey,
} from '../../../datatype';
import {
  ARTICLE_CATEGORIES,
  ARTICLE_DEFAULT_PAGE_SIZE,
  ARTICLE_FEATURED_COUNT,
  ARTICLE_PAGE_TEXT,
  ARTICLE_ROUTE_DETAIL,
  ARTICLE_SORT_OPTIONS,
  ARTICLE_STATS,
  MOCK_ARTICLES,
} from '../../core/mock-data';
import { Pagination } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-articles',
  imports: [DatePipe, NgTemplateOutlet, Pagination],
  templateUrl: './articles.html',
  styleUrl: './articles.scss',
})
export class Articles {
  constructor(
    private router: Router,
    private host: ElementRef<HTMLElement>,
  ) {}

  // Text / config (sab mock-data.ts se)
  readonly text = ARTICLE_PAGE_TEXT;
  readonly categories = ARTICLE_CATEGORIES;
  readonly sortOptions = ARTICLE_SORT_OPTIONS;

  // Baad me Api se aayega: this.api.getArticles()
  readonly articles = signal<Article[]>(MOCK_ARTICLES.map((a) => ({ ...a })));
  readonly loading = signal(false);

  // Page ki state
  readonly category = signal<ArticleFilterKey>('all');
  readonly query = signal('');
  readonly sort = signal<ArticleSortKey>('newest');
  readonly page = signal(1);
  readonly pageSize = signal(ARTICLE_DEFAULT_PAGE_SIZE);

  // Heart (favorite) abhi sirf is page me chalta hai. My Favorites se jodna alag step hai.
  readonly favIds = signal<number[]>([]);

  private readonly catMap = new Map<ArticleFilterKey, ArticleCategory>(
    ARTICLE_CATEGORIES.map((c) => [c.key, c]),
  );

  // Hero ke stats ("22 Articles", "6 Topics", ...)
  readonly statCards = computed(() =>
    ARTICLE_STATS.map((s) => ({
      ...s,
      title: s.title
        .replace('{count}', String(this.articles().length))
        .replace('{topics}', String(ARTICLE_CATEGORIES.length - 1)),
    })),
  );

  // Search + category filter + sort
  readonly filtered = computed(() => {
    const cat = this.category();
    const q = this.query().trim().toLowerCase();
    const list = this.articles().filter(
      (a) =>
        (cat === 'all' || a.category === cat) &&
        (!q || (a.title + ' ' + this.getCat(a.category).label).toLowerCase().includes(q)),
    );
    return list.sort((a, b) => {
      switch (this.sort()) {
        case 'oldest':
          return a.publishedOn.localeCompare(b.publishedOn);
        case 'az':
          return a.title.localeCompare(b.title);
        case 'quick':
          return a.readMinutes - b.readMinutes || b.publishedOn.localeCompare(a.publishedOn);
        default:
          return b.publishedOn.localeCompare(a.publishedOn);
      }
    });
  });

  // Featured block sirf tab dikhta hai jab koi filter / search / sort laga na ho
  readonly hasFeatured = computed(
    () => this.category() === 'all' && !this.query().trim() && this.sort() === 'newest',
  );
  readonly featured = computed(() =>
    this.hasFeatured() ? this.filtered().slice(0, ARTICLE_FEATURED_COUNT) : [],
  );
  readonly rest = computed(() =>
    this.hasFeatured() ? this.filtered().slice(ARTICLE_FEATURED_COUNT) : this.filtered(),
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
  getCat(key: ArticleCategoryKey): ArticleCategory {
    return this.catMap.get(key) as ArticleCategory;
  }

  // Card ka colour theme (CSS variables)
  vars(c: ArticleCategory): Record<string, string> {
    return { '--c': c.color, '--t': c.tint, '--g1': c.from, '--g2': c.to };
  }

  summaryOf(a: Article): string {
    return a.summary || this.getCat(a.category).blurb;
  }

  isFav(id: number): boolean {
    return this.favIds().includes(id);
  }

  /* ---------- filter actions ---------- */
  setCategory(key: ArticleFilterKey): void {
    this.category.set(key);
    this.page.set(1);
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  onSort(value: string): void {
    this.sort.set(value as ArticleSortKey);
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
  open(a: Article): void {
    this.router.navigate([ARTICLE_ROUTE_DETAIL, a.id]);
  }

  toggleFav(id: number, event: Event): void {
    event.stopPropagation(); // card open na ho
    this.favIds.update((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }
}