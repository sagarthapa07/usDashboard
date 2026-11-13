import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import {
  PDF_PAGE_GAP_PAD,
  PDF_THUMB_WIDTH,
  PDF_VIEWER_TEXT,
  PDF_ZOOM_MAX,
  PDF_ZOOM_MIN,
  PDF_ZOOM_PRESETS,
  PDF_ZOOM_STEP,
} from '../../core/mock-data';
import { PdfService } from '../../core/pdf';

type ZoomMode = 'width' | 'fit' | 'custom';
type ScrollMode = 'vertical' | 'horizontal' | 'wrapped';
type SpreadMode = 'none' | 'odd' | 'even';

// Do pages ke beech ka gap (px). SCSS ke .pdfv-pages gap se match hona chahiye
const PAGE_GAP = 14;

interface PdfOutlineNode {
  title: string;
  dest: string | unknown[] | null;
  items: PdfOutlineNode[];
}

interface OutlineItem {
  id: number;
  parent: number; // -1 = top level
  depth: number;
  title: string;
  dest: string | unknown[] | null;
  hasKids: boolean;
}

interface PropRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  templateUrl: './pdf-viewer.html',
  styleUrl: './pdf-viewer.scss',
})
export class PdfViewer implements AfterViewInit, OnDestroy {
  private svc = inject(PdfService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // ----- Inputs -----
  src = input.required<string>();
  fileName = input('document.pdf');
  height = input('85vh');
  allowDownload = input(true); // false = download button hat jata hai
  allowPrint = input(true); // false = print button hat jata hai

  readonly text = PDF_VIEWER_TEXT;

  @ViewChild('rootEl') rootEl!: ElementRef<HTMLElement>;
  @ViewChild('scroller') scrollerEl!: ElementRef<HTMLElement>;
  @ViewChild('pagesEl') pagesEl!: ElementRef<HTMLElement>;
  @ViewChild('sideEl') sideEl!: ElementRef<HTMLElement>;
  @ViewChild('thumbsEl') thumbsEl!: ElementRef<HTMLElement>;

  // ----- State -----
  loading = signal(true);
  error = signal(false);
  numPages = signal(0);
  current = signal(1);
  scale = signal(1);
  zoomMode = signal<ZoomMode>('width');
  rotation = signal(0);
  fullscreen = signal(false);
  sidebarOpen = signal(false);
  toolsOpen = signal(false);
  hand = signal(false);
  printing = signal(false);
  sideTab = signal<'thumbs' | 'outline'>('thumbs');
  outline = signal<OutlineItem[]>([]);
  collapsed = signal<Set<number>>(new Set());

  // Page scrolling + spreads
  scrollMode = signal<ScrollMode>('vertical');
  spreadMode = signal<SpreadMode>('none');

  // Document properties dialog
  propsOpen = signal(false);
  propRows = signal<PropRow[]>([]);

  hasOutlineKids = computed(() => this.outline().some((i) => i.hasKids));

  // Spreads sirf vertical mode me chalte hain
  spreadsAllowed = computed(() => this.scrollMode() === 'vertical');

  // Collapsed parent ke bacche chhupa do
  visibleOutline = computed(() => {
    const list = this.outline();
    const closed = this.collapsed();
    const byId = new Map(list.map((i) => [i.id, i]));
    return list.filter((i) => {
      let p = i.parent;
      while (p !== -1) {
        if (closed.has(p)) return false;
        p = byId.get(p)!.parent;
      }
      return true;
    });
  });

  // Zoom dropdown ki options
  zoomOptions = computed(() => {
    const list = [
      { v: 'width', l: this.text.fitWidth },
      { v: 'fit', l: this.text.fitPage },
      ...PDF_ZOOM_PRESETS.map((p) => ({ v: String(p), l: `${Math.round(p * 100)}%` })),
    ];
    const s = this.scale();
    if (this.zoomMode() === 'custom' && !PDF_ZOOM_PRESETS.includes(s)) {
      list.push({ v: String(s), l: `${Math.round(s * 100)}%` });
    }
    return list;
  });
  zoomValue = computed(() =>
    this.zoomMode() === 'custom' ? String(this.scale()) : this.zoomMode(),
  );

  private viewReady = signal(false);
  private task?: PDFDocumentLoadingTask;
  private doc?: PDFDocumentProxy;
  private baseW = 0;
  private baseH = 0;
  private loadId = 0;
  private lastSize = '';
  private fitRaf = 0;
  private scrollRaf = 0;
  private observer?: IntersectionObserver;
  private thumbObserver?: IntersectionObserver;
  private resizeObs?: ResizeObserver;
  private tasks = new Map<number, RenderTask>();
  private rendered = new Set<number>();
  private thumbTasks = new Map<number, RenderTask>();
  private thumbsRendered = new Set<number>();
  private drag?: { x: number; y: number; l: number; t: number };

  constructor() {
    effect(() => {
      const url = this.src();
      if (!this.viewReady()) return;
      untracked(() => this.load(url));
    });

    // Page badalne par sidebar me thumbnail highlight hota hai
    effect(() => {
      const c = this.current();
      untracked(() => this.markThumb(c));
    });
  }

  ngAfterViewInit(): void {
    // Server (SSR) pe kuch mat karo, browser APIs wahan nahi hote
    if (!this.isBrowser) return;

    const scroller = this.scrollerEl.nativeElement;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) this.renderPage(Number((e.target as HTMLElement).dataset['page']));
        }
      },
      { root: scroller, rootMargin: '600px 600px' },
    );

    this.thumbObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) this.renderThumb(Number((e.target as HTMLElement).dataset['page']));
        }
      },
      { root: this.sideEl.nativeElement, rootMargin: '300px 0px' },
    );

    // Fit mode me container ka size badle to scale dobara set karo
    this.resizeObs = new ResizeObserver(() => {
      if (!this.doc || this.zoomMode() === 'custom') return;
      const key = `${scroller.clientWidth}x${scroller.clientHeight}`;
      if (key === this.lastSize) return;
      this.lastSize = key;
      cancelAnimationFrame(this.fitRaf);
      this.fitRaf = requestAnimationFrame(() => {
        const next = this.fitScale(this.zoomMode());
        if (Math.abs(next - this.scale()) > 0.001) this.applyScale(next);
      });
    });
    this.resizeObs.observe(scroller);

    this.applyLayoutClass();
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      cancelAnimationFrame(this.fitRaf);
      cancelAnimationFrame(this.scrollRaf);
    }
    this.resizeObs?.disconnect();
    this.cleanup();
  }

  // ----- Load -----
  async load(url: string): Promise<void> {
    const id = ++this.loadId;
    this.cleanup();
    this.loading.set(true);
    this.error.set(false);
    this.numPages.set(0);
    this.current.set(1);
    this.rotation.set(0);
    this.zoomMode.set('width');

    try {
      const task = await this.svc.open(url);
      if (id !== this.loadId) {
        task.destroy();
        return;
      }
      this.task = task;
      const doc = await task.promise;
      if (id !== this.loadId) return;

      this.doc = doc;
      const first = await doc.getPage(1);
      const vp = first.getViewport({ scale: 1 });
      this.baseW = vp.width;
      this.baseH = vp.height;

      this.numPages.set(doc.numPages);
      this.scale.set(this.fitScale('width'));
      this.lastSize = `${this.scrollerEl.nativeElement.clientWidth}x${this.scrollerEl.nativeElement.clientHeight}`;
      this.buildPages();
      this.buildThumbs();
      this.loadOutline(doc);
      this.loading.set(false);
    } catch {
      if (id !== this.loadId) return;
      this.loading.set(false);
      this.error.set(true);
    }
  }

  retry(): void {
    this.load(this.src());
  }

  private cleanup(): void {
    this.tasks.forEach((t) => t.cancel());
    this.tasks.clear();
    this.rendered.clear();
    this.observer?.disconnect();
    this.thumbTasks.forEach((t) => t.cancel());
    this.thumbTasks.clear();
    this.thumbsRendered.clear();
    this.thumbObserver?.disconnect();
    if (this.pagesEl) this.pagesEl.nativeElement.innerHTML = '';
    if (this.thumbsEl) this.thumbsEl.nativeElement.innerHTML = '';
    this.task?.destroy();
    this.task = undefined;
    this.outline.set([]);
    this.collapsed.set(new Set());
    this.sideTab.set('thumbs');
    this.propsOpen.set(false);
    this.propRows.set([]);
    this.doc = undefined;
  }

  // Rotation ke hisaab se page ki width / height
  private dims(): [number, number] {
    return this.rotation() % 180 !== 0 ? [this.baseH, this.baseW] : [this.baseW, this.baseH];
  }

  // ----- Layout (scroll mode + spreads) -----
  private spreadOn(): boolean {
    return this.scrollMode() === 'vertical' && this.spreadMode() !== 'none';
  }

  // Class seedhe DOM par lagti hai (change detection ka wait nahi), taaki turant re-layout ho
  private applyLayoutClass(): void {
    if (!this.pagesEl) return;
    const m = { vertical: 'm-v', horizontal: 'm-h', wrapped: 'm-w' }[this.scrollMode()];
    const s = this.spreadOn() ? (this.spreadMode() === 'odd' ? 's-odd' : 's-even') : '';
    this.pagesEl.nativeElement.className = `pdfv-pages ${m} ${s}`.trim();
  }

  private relayout(): void {
    this.applyLayoutClass();
    if (!this.doc) return;
    const mode = this.zoomMode();
    this.applyScale(mode === 'custom' ? this.scale() : this.fitScale(mode));
  }

  setScrollMode(m: ScrollMode): void {
    this.toolsOpen.set(false);
    if (this.scrollMode() === m) return;
    this.scrollMode.set(m);
    this.relayout();
  }

  setSpreadMode(m: SpreadMode): void {
    this.toolsOpen.set(false);
    if (!this.spreadsAllowed() || this.spreadMode() === m) return;
    this.spreadMode.set(m);
    this.relayout();
  }

  // ----- Pages -----
  private buildPages(): void {
    this.applyLayoutClass();
    const box = this.pagesEl.nativeElement;
    box.innerHTML = '';

    for (let n = 1; n <= this.numPages(); n++) {
      const pg = document.createElement('div');
      pg.className = 'pdfv-pg';
      pg.dataset['page'] = String(n);
      pg.appendChild(document.createElement('canvas'));
      this.sizePlaceholder(pg);
      box.appendChild(pg);
      this.observer?.observe(pg);
    }
  }

  private sizePlaceholder(pg: HTMLElement): void {
    const [w, h] = this.dims();
    pg.style.width = `${Math.floor(w * this.scale())}px`;
    pg.style.height = `${Math.floor(h * this.scale())}px`;
  }

  private async renderPage(n: number): Promise<void> {
    if (!this.doc || this.rendered.has(n)) return;
    this.rendered.add(n);

    const doc = this.doc;
    const id = this.loadId;
    const scaleAtStart = this.scale();
    const rotAtStart = this.rotation();
    const pg = this.pagesEl.nativeElement.children[n - 1] as HTMLElement | undefined;
    const canvas = pg?.querySelector('canvas');
    if (!pg || !canvas) return;

    try {
      const page = await doc.getPage(n);
      if (id !== this.loadId || scaleAtStart !== this.scale() || rotAtStart !== this.rotation())
        return;

      const rt = this.svc.renderPage(page, canvas, scaleAtStart, rotAtStart);
      this.tasks.set(n, rt);
      await rt.promise;

      pg.style.width = canvas.style.width;
      pg.style.height = canvas.style.height;
    } catch (e) {
      if ((e as { name?: string })?.name !== 'RenderingCancelledException') this.rendered.delete(n);
    } finally {
      this.tasks.delete(n);
    }
  }

  // ----- Thumbnails (sidebar) -----
  private buildThumbs(): void {
    const box = this.thumbsEl.nativeElement;
    box.innerHTML = '';

    for (let n = 1; n <= this.numPages(); n++) {
      const th = document.createElement('div');
      th.className = 'pdfv-th';
      th.dataset['page'] = String(n);

      const frame = document.createElement('div');
      frame.className = 'pdfv-thb';
      frame.appendChild(document.createElement('canvas'));

      const label = document.createElement('span');
      label.textContent = String(n);

      th.append(frame, label);
      this.sizeThumb(th);
      box.appendChild(th);
      this.thumbObserver?.observe(th);
    }
    this.markThumb(this.current());
  }

  private sizeThumb(th: HTMLElement): void {
    const [bw, bh] = this.dims();
    const frame = th.firstElementChild as HTMLElement;
    frame.style.width = `${PDF_THUMB_WIDTH}px`;
    frame.style.height = `${Math.floor((PDF_THUMB_WIDTH * bh) / bw)}px`;
  }

  // Rotate karne par thumbnails dobara bante hain
  private relayoutThumbs(): void {
    this.thumbTasks.forEach((t) => t.cancel());
    this.thumbTasks.clear();
    this.thumbsRendered.clear();
    this.thumbObserver?.disconnect();

    const items = Array.from(this.thumbsEl.nativeElement.children) as HTMLElement[];
    for (const th of items) {
      const c = th.querySelector('canvas');
      if (c) {
        c.width = 0;
        c.height = 0;
        c.removeAttribute('style');
      }
      this.sizeThumb(th);
      this.thumbObserver?.observe(th);
    }
  }

  private async renderThumb(n: number): Promise<void> {
    if (!this.doc || this.thumbsRendered.has(n)) return;
    this.thumbsRendered.add(n);

    const doc = this.doc;
    const id = this.loadId;
    const rot = this.rotation();
    const th = this.thumbsEl.nativeElement.children[n - 1] as HTMLElement | undefined;
    const canvas = th?.querySelector('canvas');
    if (!canvas) return;

    try {
      const page = await doc.getPage(n);
      if (id !== this.loadId || rot !== this.rotation()) return;

      const [bw] = this.dims();
      const rt = this.svc.renderPage(page, canvas, PDF_THUMB_WIDTH / bw, rot);
      this.thumbTasks.set(n, rt);
      await rt.promise;
    } catch (e) {
      if ((e as { name?: string })?.name !== 'RenderingCancelledException')
        this.thumbsRendered.delete(n);
    } finally {
      this.thumbTasks.delete(n);
    }
  }

  private markThumb(page: number): void {
    if (!this.thumbsEl) return;
    const items = Array.from(this.thumbsEl.nativeElement.children) as HTMLElement[];
    items.forEach((th, i) => th.classList.toggle('on', i + 1 === page));

    const side = this.sideEl?.nativeElement;
    const active = items[page - 1];
    if (side && active && this.sidebarOpen()) {
      side.scrollTop = active.offsetTop - side.clientHeight / 2 + active.offsetHeight / 2;
    }
  }

  onThumbClick(e: Event): void {
    const th = (e.target as HTMLElement).closest('.pdfv-th') as HTMLElement | null;
    if (th) this.goTo(Number(th.dataset['page']));
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
    setTimeout(() => this.markThumb(this.current()));
  }

  // ----- Outline (bookmarks) -----
  private async loadOutline(doc: PDFDocumentProxy): Promise<void> {
    try {
      const tree = (await doc.getOutline()) as PdfOutlineNode[] | null;
      if (doc !== this.doc) return;

      const flat: OutlineItem[] = [];
      let uid = 0;
      const walk = (nodes: PdfOutlineNode[], depth: number, parent: number) => {
        for (const n of nodes) {
          const id = uid++;
          const kids = n.items?.length ?? 0;
          flat.push({ id, parent, depth, title: n.title, dest: n.dest, hasKids: kids > 0 });
          if (kids) walk(n.items, depth + 1, id);
        }
      };
      walk(tree ?? [], 0, -1);

      this.outline.set(flat);
      // By default sab collapsed
      this.collapsed.set(new Set(flat.filter((i) => i.hasKids).map((i) => i.id)));
    } catch {
      this.outline.set([]);
    }
  }

  toggleOutlineNode(id: number, e: Event): void {
    e.stopPropagation();
    const next = new Set(this.collapsed());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.collapsed.set(next);
  }

  // Top-right wala icon: sab expand / sab collapse
  toggleAllOutline(): void {
    const parents = this.outline()
      .filter((i) => i.hasKids)
      .map((i) => i.id);
    this.collapsed.set(this.collapsed().size ? new Set() : new Set(parents));
  }

  async goToOutline(item: OutlineItem): Promise<void> {
    if (!this.doc || !item.dest) return;
    try {
      const explicit =
        typeof item.dest === 'string' ? await this.doc.getDestination(item.dest) : item.dest;
      if (!explicit) return;
      const ref = explicit[0];
      const idx =
        typeof ref === 'object' && ref !== null
          ? await this.doc.getPageIndex(ref as never)
          : Number(ref);
      this.goTo(idx + 1);
    } catch {
      /* galat destination ho to chup-chaap ignore */
    }
  }

  // ----- Zoom -----
  private fitScale(mode: ZoomMode): number {
    const sc = this.scrollerEl.nativeElement;
    const [bw, bh] = this.dims();
    if (!bw || !bh) return 1;

    // Spread me do pages ek row me aate hain, to width aadhi lagti hai
    const cols = this.spreadOn() ? 2 : 1;
    let s = (sc.clientWidth - PDF_PAGE_GAP_PAD - (cols - 1) * PAGE_GAP) / (bw * cols);
    if (mode === 'fit') s = Math.min(s, (sc.clientHeight - PDF_PAGE_GAP_PAD) / bh);
    if (!(s > 0)) return 1;
    return Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, s));
  }

  private applyScale(next: number): void {
    const keep = this.current();
    this.scale.set(next);

    this.tasks.forEach((t) => t.cancel());
    this.tasks.clear();
    this.rendered.clear();
    this.observer?.disconnect();

    const pages = Array.from(this.pagesEl.nativeElement.children) as HTMLElement[];
    for (const pg of pages) {
      const c = pg.querySelector('canvas');
      if (c) {
        c.width = 0;
        c.height = 0;
        c.removeAttribute('style');
      }
      this.sizePlaceholder(pg);
      this.observer?.observe(pg);
    }
    this.goTo(keep, false);
  }

  zoomIn(): void {
    this.zoomMode.set('custom');
    this.applyScale(Math.min(PDF_ZOOM_MAX, +(this.scale() + PDF_ZOOM_STEP).toFixed(2)));
  }

  zoomOut(): void {
    this.zoomMode.set('custom');
    this.applyScale(Math.max(PDF_ZOOM_MIN, +(this.scale() - PDF_ZOOM_STEP).toFixed(2)));
  }

  onZoomSelect(value: string): void {
    if (!this.doc) return;
    if (value === 'width' || value === 'fit') {
      this.zoomMode.set(value);
      this.applyScale(this.fitScale(value));
    } else {
      this.zoomMode.set('custom');
      this.applyScale(Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, Number(value))));
    }
  }

  // ----- Rotate -----
  rotate(delta: number): void {
    if (!this.doc) return;
    this.rotation.set((this.rotation() + delta + 360) % 360);
    this.relayoutThumbs();
    const mode = this.zoomMode();
    this.applyScale(mode === 'custom' ? this.scale() : this.fitScale(mode));
  }

  // ----- Navigation -----
  goTo(n: number, smooth = true): void {
    const total = this.numPages();
    if (!total) return;
    const page = Math.min(total, Math.max(1, Math.floor(n) || 1));
    const pg = this.pagesEl.nativeElement.children[page - 1] as HTMLElement | undefined;
    if (!pg) return;

    const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
    if (this.scrollMode() === 'horizontal') {
      this.scrollerEl.nativeElement.scrollTo({ left: pg.offsetLeft - 12, behavior });
    } else {
      this.scrollerEl.nativeElement.scrollTo({ top: pg.offsetTop - 12, behavior });
    }
    this.current.set(page);
  }

  onPageInput(input: HTMLInputElement): void {
    this.goTo(Number(input.value));
    input.value = String(this.current());
  }

  onScroll(): void {
    if (!this.isBrowser) return;
    cancelAnimationFrame(this.scrollRaf);
    this.scrollRaf = requestAnimationFrame(() => {
      const sc = this.scrollerEl.nativeElement;
      const pages = Array.from(this.pagesEl.nativeElement.children) as HTMLElement[];
      const horizontal = this.scrollMode() === 'horizontal';
      const pos = (horizontal ? sc.scrollLeft : sc.scrollTop) + 40;

      for (let i = 0; i < pages.length; i++) {
        const end = horizontal
          ? pages[i].offsetLeft + pages[i].offsetWidth
          : pages[i].offsetTop + pages[i].offsetHeight;
        if (end > pos) {
          if (this.current() !== i + 1) this.current.set(i + 1);
          return;
        }
      }
    });
  }

  // ----- Tools menu -----
  toggleTools(e: Event): void {
    e.stopPropagation();
    this.toolsOpen.set(!this.toolsOpen());
  }

  toggleHand(): void {
    this.hand.set(!this.hand());
    this.toolsOpen.set(false);
  }

  onDragStart(e: MouseEvent): void {
    if (!this.hand()) return;
    const s = this.scrollerEl.nativeElement;
    this.drag = { x: e.clientX, y: e.clientY, l: s.scrollLeft, t: s.scrollTop };
    e.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onDragMove(e: MouseEvent): void {
    if (!this.drag) return;
    const s = this.scrollerEl.nativeElement;
    s.scrollLeft = this.drag.l - (e.clientX - this.drag.x);
    s.scrollTop = this.drag.t - (e.clientY - this.drag.y);
  }

  @HostListener('document:mouseup')
  onDragEnd(): void {
    this.drag = undefined;
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.toolsOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.toolsOpen.set(false);
    this.propsOpen.set(false);
  }

  // ----- Document properties -----
  async openProps(): Promise<void> {
    const doc = this.doc;
    if (!doc) return;
    this.toolsOpen.set(false);
    this.propRows.set([]);
    this.propsOpen.set(true);

    const dash = '-';
    const str = (v: unknown): string =>
      v === undefined || v === null || v === '' ? dash : String(v);

    try {
      const meta = await doc.getMetadata();
      if (doc !== this.doc) return;

      const info = (meta.info ?? {}) as Record<string, unknown>;
      const size = (meta as { contentLength?: number }).contentLength;

      this.propRows.set([
        { label: 'File name', value: this.fileName() },
        { label: 'File size', value: this.fmtSize(size) },
        { label: 'Title', value: str(info['Title']) },
        { label: 'Author', value: str(info['Author']) },
        { label: 'Subject', value: str(info['Subject']) },
        { label: 'Keywords', value: str(info['Keywords']) },
        { label: 'Creation date', value: this.fmtDate(info['CreationDate']) },
        { label: 'Modification date', value: this.fmtDate(info['ModDate']) },
        { label: 'Creator', value: str(info['Creator']) },
        { label: 'PDF producer', value: str(info['Producer']) },
        { label: 'PDF version', value: str(info['PDFFormatVersion']) },
        { label: 'Page count', value: String(doc.numPages) },
        { label: 'Page size', value: this.fmtPageSize() },
        { label: 'Fast web view', value: info['IsLinearized'] ? 'Yes' : 'No' },
      ]);
    } catch {
      this.propRows.set([
        { label: 'File name', value: this.fileName() },
        { label: 'Page count', value: String(doc.numPages) },
        { label: 'Page size', value: this.fmtPageSize() },
      ]);
    }
  }

  closeProps(): void {
    this.propsOpen.set(false);
  }

  private fmtSize(bytes?: number): string {
    if (!bytes || bytes <= 0) return '-';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // PDF date "D:20240115103000+05'30'" => readable date
  private fmtDate(v: unknown): string {
    if (!v) return '-';
    const m = /^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(String(v));
    if (!m) return String(v);
    const [, y, mo = '01', d = '01', h = '00', mi = '00', s = '00'] = m;
    const dt = new Date(+y, +mo - 1, +d, +h, +mi, +s);
    return isNaN(dt.getTime()) ? String(v) : dt.toLocaleString();
  }

  // Page 1 ki size (PDF points => inch / mm)
  private fmtPageSize(): string {
    if (!this.baseW || !this.baseH) return '-';
    const inW = this.baseW / 72;
    const inH = this.baseH / 72;
    const mmW = Math.round(inW * 25.4);
    const mmH = Math.round(inH * 25.4);
    const dir = this.baseH >= this.baseW ? 'Portrait' : 'Landscape';
    return `${inW.toFixed(2)} × ${inH.toFixed(2)} in (${mmW} × ${mmH} mm, ${dir})`;
  }

  // ----- Print -----
  async printDoc(): Promise<void> {
    if (!this.doc || !this.allowPrint() || this.printing()) return;
    this.toolsOpen.set(false);

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<p style="font-family:sans-serif">${this.text.preparingPrint}</p>`);

    this.printing.set(true);
    try {
      const doc = this.doc;
      const imgs: string[] = [];
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        imgs.push(await this.svc.toDataUrl(page, 1.6, this.rotation()));
      }
      win.document.open();
      win.document.write(
        `<html><head><title>${this.fileName()}</title><style>@page{margin:0}body{margin:0}img{display:block;width:100%;page-break-after:always}</style></head><body>${imgs
          .map((s) => `<img src="${s}">`)
          .join('')}</body></html>`,
      );
      win.document.close();
      setTimeout(() => {
        win.focus();
        win.print();
      }, 500);
    } catch {
      win.close();
    } finally {
      this.printing.set(false);
    }
  }

  // ----- Fullscreen -----
  toggleFullscreen(): void {
    this.toolsOpen.set(false);
    if (document.fullscreenElement) document.exitFullscreen();
    else this.rootEl.nativeElement.requestFullscreen?.();
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.fullscreen.set(document.fullscreenElement === this.rootEl?.nativeElement);
    if (this.zoomMode() !== 'custom') setTimeout(() => this.onZoomSelect(this.zoomMode()));
  }
}
