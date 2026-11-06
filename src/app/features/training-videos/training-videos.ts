import { DatePipe, DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  TrainingVideo,
  TrainingVideoAttachment,
  TrainingVideoCategory,
  TrainingVideoPresenter,
  TrainingVideoSortKey,
} from '../../../datatype';
import {
  MOCK_TRAINING_VIDEOS,
  TV_CATEGORIES,
  TV_DEFAULT_ATTACHMENTS,
  TV_PAGE_SIZE,
  TV_PAGE_TEXT,
  TV_PRESENTERS,
  TV_RELATED_COUNT,
  TV_RELATED_TITLE_MAX,
  TV_SORT_OPTIONS,
} from '../../core/mock-data';
import { Buttons } from '../../shared/buttons/buttons';
import { Pagination } from '../../shared/pagination/pagination';
import { VideoPlayer } from '../video-player/video-player';

// videoUrl khali ho to ye demo video chalegi (apna real link videoUrl me daalo)
const DEMO_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const FAV_KEY = 'gfu_fav'; // My Favorites isi key se 'tv:<id>' padhta hai
const FALLBACK_COLORS = { from: '#1d4f91', to: '#3b82c4' };

@Component({
  selector: 'app-training-videos',
  standalone: true,
  imports: [DatePipe, VideoPlayer, Buttons, Pagination],
  templateUrl: './training-videos.html',
  styleUrl: './training-videos.scss',
})
export class TrainingVideos implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /* ---------- static data (mock-data se) ---------- */
  readonly text = TV_PAGE_TEXT;
  readonly sortOptions = TV_SORT_OPTIONS;
  readonly categories = TV_CATEGORIES;
  readonly videos: TrainingVideo[] = MOCK_TRAINING_VIDEOS;
  readonly demoUrl = DEMO_VIDEO_URL;

  private readonly catColors = new Map<string, TrainingVideoCategory>(
    TV_CATEGORIES.map((c): [string, TrainingVideoCategory] => [c.name, c]),
  );
  private readonly presenterMap = new Map<string, TrainingVideoPresenter>(
    TV_PRESENTERS.map((p): [string, TrainingVideoPresenter] => [p.name, p]),
  );

  /* ---------- filter state ---------- */
  readonly areas = signal<string[]>([]);
  readonly query = signal('');
  readonly sort = signal<TrainingVideoSortKey>('newest');
  readonly page = signal(1);
  readonly pageSize = signal(TV_PAGE_SIZE);

  /* ---------- modal state ---------- */
  readonly activeId = signal<number | string | null>(null);
  readonly favs = signal<string[]>(this.readFavs());

  /* ---------- derived ---------- */
  readonly filtered = computed(() => {
    const areas = this.areas();
    const q = this.query().trim().toLowerCase();
    const list = this.videos.filter(
      (v) =>
        (!areas.length || areas.includes(v.category)) &&
        (!q || `${v.title} ${v.presenter} ${v.category}`.toLowerCase().includes(q)),
    );
    const s = this.sort();
    return [...list].sort((a, b) =>
      s === 'az'
        ? a.title.localeCompare(b.title)
        : s === 'shortest'
          ? a.minutes - b.minutes
          : b.postedOn.localeCompare(a.postedOn),
    );
  });

  readonly total = computed(() => this.filtered().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  readonly pageItems = computed(() => {
    const p = this.currentPage();
    const size = this.pageSize();
    return this.filtered().slice((p - 1) * size, p * size);
  });

  readonly active = computed(() => this.videos.find((v) => v.id === this.activeId()) ?? null);

  readonly related = computed(() => {
    const a = this.active();
    if (!a) return [];
    return this.videos
      .filter((v) => v.category === a.category && v.id !== a.id)
      .slice(0, TV_RELATED_COUNT);
  });

  readonly presenter = computed(() => {
    const a = this.active();
    return a ? (this.presenterMap.get(a.presenter) ?? null) : null;
  });

  // YouTube / Vimeo link ho to iframe, nahi to apna custom player
  readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    const u = this.active()?.videoUrl ?? '';
    const yt = u.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
    const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    const url = yt
      ? `https://www.youtube.com/embed/${yt[1]}?autoplay=1`
      : vm
        ? `https://player.vimeo.com/video/${vm[1]}?autoplay=1`
        : '';
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  /* ---------- hero title: aakhri word accent colour me ---------- */
  get titleStart(): string {
    return this.text.title.split(' ').slice(0, -1).join(' ');
  }
  get titleAccent(): string {
    return this.text.title.split(' ').slice(-1)[0];
  }

  /* ---------- helpers for template ---------- */
  colors(v: TrainingVideo): { from: string; to: string } {
    const c = this.catColors.get(v.category);
    return c ? { from: c.colorFrom, to: c.colorTo } : FALLBACK_COLORS;
  }

  countOf(name: string): number {
    return this.videos.filter((v) => v.category === name).length;
  }

  selectedArea(): string {
    return this.areas().length === 1 ? this.areas()[0] : '';
  }

  description(v: TrainingVideo): string {
    return v.description ?? this.text.descriptionTemplate.replace('{category}', v.category);
  }

  attachments(v: TrainingVideo): TrainingVideoAttachment[] {
    return v.attachments?.length ? v.attachments : TV_DEFAULT_ATTACHMENTS;
  }

  initials(name: string): string {
    const words = name
      .replace(/^(Dr|MSc\.?|Prof\.?)\s+/i, '')
      .split(/\s+/)
      .filter(Boolean);
    const first = words[0]?.[0] ?? '';
    const last = words.length > 1 ? words[words.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  shortTitle(t: string): string {
    return t.length > TV_RELATED_TITLE_MAX ? t.slice(0, TV_RELATED_TITLE_MAX) + '…' : t;
  }

  /* ---------- filter actions ---------- */
  onArea(value: string): void {
    this.areas.set(value ? [value] : []);
    this.page.set(1);
  }

  togglePill(name: string | null): void {
    if (name === null) {
      this.areas.set([]);
    } else {
      this.areas.update((a) => (a.includes(name) ? a.filter((x) => x !== name) : [...a, name]));
    }
    this.page.set(1);
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  onSort(value: string): void {
    this.sort.set(value as TrainingVideoSortKey);
    this.page.set(1);
  }

  reset(): void {
    this.areas.set([]);
    this.query.set('');
    this.sort.set('newest');
    this.page.set(1);
  }

  onSearch(): void {
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

  /* ---------- modal ---------- */
  open(v: TrainingVideo): void {
    this.activeId.set(v.id);
    this.doc.body.style.overflow = 'hidden';
    // related video click par popup ko upar scroll kar do
    queueMicrotask(() => this.host.nativeElement.querySelector('.tv-md')?.scrollTo(0, 0));
  }

  close(): void {
    this.activeId.set(null);
    this.doc.body.style.overflow = '';
  }

  onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.activeId() !== null) this.close();
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = '';
  }

  /* ---------- favorites (localStorage, My Favorites page ke saath same key) ---------- */
  private readFavs(): string[] {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    } catch {
      return [];
    }
  }

  isFav(id: number | string): boolean {
    return this.favs().includes('tv:' + id);
  }

  toggleFav(id: number | string): void {
    const k = 'tv:' + id;
    const next = this.favs().includes(k) ? this.favs().filter((x) => x !== k) : [...this.favs(), k];
    this.favs.set(next);
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  /* ---------- attachments ---------- */
  // url '#' / khali ho to placeholder .txt download hoti hai. Real PDF link daalo to seedha download
  onAttachment(e: Event, a: TrainingVideoAttachment): void {
    if (a.url && a.url !== '#') return;
    e.preventDefault();
    const link = this.doc.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([`Placeholder attachment: ${a.name}\n(Real file ka link attachments me daalo)`], {
        type: 'text/plain',
      }),
    );
    link.download = a.name.replace(/[^\w.-]+/g, '-') + '.txt';
    this.doc.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
}