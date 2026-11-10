import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Article, ArticleCategory, GrantCardData } from '../../../datatype';
import {
  ARTICLE_CATEGORIES,
  ARTICLE_DETAIL_TEXT,
  ARTICLE_ROUTE_DETAIL,
  ARTICLE_ROUTE_LIST,
  ARTICLE_ROUTE_SEARCH,
  MOCK_ARTICLES,
  MOCK_GRANTS,
} from '../../core/mock-data';

interface TocItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-article-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.scss',
})
export class ArticleDetail implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private destroyRef: DestroyRef,
    @Inject(DOCUMENT) private doc: Document,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  readonly text = ARTICLE_DETAIL_TEXT;
  readonly listRoute = ARTICLE_ROUTE_LIST;
  readonly searchRoute = ARTICLE_ROUTE_SEARCH;

  bodyEl = viewChild<ElementRef<HTMLElement>>('body');

  // Baad me Api se aayega: this.api.getArticles() / this.api.getArticle(id)
  all = signal<Article[]>(MOCK_ARTICLES);
  article = signal<Article | null>(null);
  grants = signal<GrantCardData[]>([]);
  loading = signal(true);
  checks = signal<boolean[]>([]);
  progress = signal(0); // reading progress bar (0-100)
  activeId = signal('');
  toast = signal('');
  favIds = signal<number[]>([]); // abhi sirf is page me; My Favorites se jodna alag step hai
  private toastTimer: any;

  private catMap = new Map(ARTICLE_CATEGORIES.map((c) => [c.key, c]));

  // SSR par window / document nahi hota, isliye browser check
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  category = computed<ArticleCategory | null>(() => {
    const a = this.article();
    return a ? (this.catMap.get(a.category) as ArticleCategory) : null;
  });

  vars = computed((): Record<string, string> => {
    const c = this.category();
    if (!c) return {};
    return { '--c': c.color, '--t': c.tint, '--g1': c.from, '--g2': c.to };
  });

  initials = computed(() =>
    (this.article()?.author.name ?? '')
      .split(' ')
      .map((x) => x[0])
      .join(''),
  );

  // Newest se oldest tak ("More to read" ke liye)
  ordered = computed(() =>
    [...this.all()].sort((a, b) => b.publishedOn.localeCompare(a.publishedOn)),
  );

  // "More to read": pehle same category, phir baaki (latest first), total 3
  related = computed(() => {
    const a = this.article();
    if (!a) return [];
    return this.ordered()
      .filter((x) => x.id !== a.id)
      .sort((x, y) => Number(y.category === a.category) - Number(x.category === a.category))
      .slice(0, 3);
  });

  // Right side "In this article" list
  toc = computed<TocItem[]>(() => {
    const a = this.article();
    if (!a) return [];
    const items: TocItem[] = a.body.sections.map((s, i) => ({ id: 'ad-s' + i, label: s.heading }));
    if (this.grants().length) items.push({ id: 'ad-grants', label: this.text.grantsTitle });
    items.push({ id: 'ad-ck', label: this.text.checklistTitle });
    return items;
  });

  checkedCount = computed(() => this.checks().filter(Boolean).length);
  readyText = computed(() => {
    const total = this.checks().length;
    return this.checkedCount() === total && total > 0
      ? this.text.allReady
      : this.text.readyText
          .replace('{n}', String(this.checkedCount()))
          .replace('{total}', String(total));
  });

  isFav = computed(() => this.favIds().includes(this.article()?.id ?? -1));

  ngOnInit(): void {
    // URL ka :id badalte hi (More to read) article dobara load hota hai
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      this.load(Number(p.get('id')));
    });
  }

  private load(id: number): void {
    const a = this.all().find((x) => x.id === id) ?? null;
    this.article.set(a);
    this.loading.set(false);
    if (!a) {
      this.grants.set([]);
      return;
    }

    this.checks.set(a.body.checklist.map(() => false));

    // "Grants worth a look": 3 grants (Baad me Api se aayega)
    this.grants.set([0, 1, 2].map((k) => MOCK_GRANTS[(a.id * 3 + k) % MOCK_GRANTS.length]));

    this.activeId.set('ad-s0');
    this.doc.title = a.title + ' – GrantsforUS';

    // Neeche ka kaam sirf browser me
    if (this.isBrowser) {
      this.doc.defaultView?.scrollTo(0, 0);
      setTimeout(() => this.onScroll());
    }
  }

  /* ---------- reading progress + TOC highlight ---------- */
  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.isBrowser) return;
    const body = this.bodyEl()?.nativeElement;
    const win = this.doc.defaultView;
    if (!body || !win) return;

    const r = body.getBoundingClientRect();
    const total = r.height - win.innerHeight * 0.5;
    this.progress.set(Math.max(0, Math.min(1, (-r.top + 80) / Math.max(total, 1))) * 100);

    let on = this.toc()[0]?.id ?? '';
    for (const t of this.toc()) {
      const el = this.doc.getElementById(t.id);
      if (el && el.getBoundingClientRect().top <= 140) on = t.id;
    }
    this.activeId.set(on);
  }

  goToSection(id: string, event: Event): void {
    event.preventDefault();
    if (!this.isBrowser) return;
    const reduce = this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.doc
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- actions ---------- */
  openArticle(a: Article | null): void {
    if (a) this.router.navigate([ARTICLE_ROUTE_DETAIL, a.id]);
  }

  toggleCheck(index: number, checked: boolean): void {
    this.checks.update((arr) => arr.map((v, i) => (i === index ? checked : v)));
  }

  toggleFav(): void {
    const id = this.article()?.id;
    if (id == null) return;
    this.favIds.update((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }

  async copyLink(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      await navigator.clipboard.writeText(this.doc.location.href);
      this.showToast(this.text.linkCopied);
    } catch {
      this.showToast(this.text.copyFailed);
    }
  }

  print(): void {
    if (this.isBrowser) this.doc.defaultView?.print();
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2200);
  }

  catOf(a: Article): ArticleCategory {
    return this.catMap.get(a.category) as ArticleCategory;
  }
}