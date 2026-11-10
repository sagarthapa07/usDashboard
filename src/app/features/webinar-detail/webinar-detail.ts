import {
  Component,
  DestroyRef,
  HostListener,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  computed,
  signal,
} from '@angular/core';
import { DOCUMENT, DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Webinar, WebinarCategory, WebinarStatus } from '../../../datatype';
import {
  MOCK_WEBINARS,
  WEBINAR_CATEGORIES,
  WEBINAR_CATEGORY_CONTENT,
  WEBINAR_DEFAULT_BODY,
  WEBINAR_DETAIL_TEXT,
  WEBINAR_ROUTE_DETAIL,
  WEBINAR_ROUTE_LIST,
  WEBINAR_ROUTE_VIDEOS,
  getWebinar,
  getWebinarStart,
  getWebinarStatus,
} from '../../core/mock-data';

@Component({
  selector: 'app-webinar-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './webinar-detail.html',
  styleUrl: './webinar-detail.scss',
})
export class WebinarDetail implements OnDestroy {
  // Text / config (sab mock-data.ts se)
  readonly text = WEBINAR_DETAIL_TEXT;
  readonly listRoute = WEBINAR_ROUTE_LIST;

  // URL se webinar id (/webinar/:id)
  readonly id = signal<number>(-1);

  // Baad me Api se aayega: this.api.getWebinar(id)
  readonly webinar = computed<Webinar | null>(() => getWebinar(this.id()));
  readonly loading = signal(false);

  // Countdown ke liye har second badalta "abhi ka time" (timer sirf browser me chalta hai)
  readonly now = signal(Date.now());
  private timer: ReturnType<typeof setInterval> | undefined;

  // Abhi ye teeno sirf is page me chalte hain (page se bahar jaane par reset).
  // Registration / favorites ko API ya My Favorites se jodna alag step hai.
  readonly registered = signal<number[]>([]);
  readonly favIds = signal<number[]>([]);
  readonly checked = signal<boolean[]>(WEBINAR_DETAIL_TEXT.checklist.map(() => false));

  readonly toast = signal('');
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  // Scroll progress bar + "On this page" highlight
  readonly progress = signal(0);
  readonly activeSection = signal('wd-s0');

  private readonly catMap = new Map<string, WebinarCategory>(
    WEBINAR_CATEGORIES.map((c) => [c.key, c]),
  );

  // Newer / older ke liye latest se purane tak list
  private readonly ordered = MOCK_WEBINARS.slice().sort(
    (a, b) => getWebinarStart(b) - getWebinarStart(a),
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private destroyRef: DestroyRef,
    @Inject(DOCUMENT) private doc: Document,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    // SSR par window / timers nahi chahiye, isliye sirf browser me
    if (this.isBrowser) {
      this.timer = setInterval(() => this.now.set(Date.now()), 1000);
    }

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      const n = Number(p.get('id'));
      this.id.set(Number.isNaN(n) ? -1 : n);
      this.checked.set(this.text.checklist.map(() => false));
      this.activeSection.set('wd-s0');
      if (this.isBrowser) this.doc.defaultView?.scrollTo({ top: 0 });
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    clearTimeout(this.toastTimer);
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /* ---------- computed values ---------- */
  readonly cat = computed<WebinarCategory | null>(() => {
    const w = this.webinar();
    return w ? (this.catMap.get(w.category) as WebinarCategory) : null;
  });

  readonly status = computed<WebinarStatus>(() => {
    const w = this.webinar();
    return w ? getWebinarStatus(w, this.now()) : 'recorded';
  });

  readonly startMs = computed(() => {
    const w = this.webinar();
    return w ? getWebinarStart(w) : 0;
  });
  readonly endMs = computed(() => {
    const w = this.webinar();
    return w ? this.startMs() + w.minutes * 60000 : 0;
  });

  // Hero / card ka colour theme
  readonly themeVars = computed((): Record<string, string> => {
    const vars: Record<string, string> = {};
    const c = this.cat();
    if (c) {
      vars['--c'] = c.color;
      vars['--t'] = c.tint;
      vars['--g1'] = c.from;
      vars['--g2'] = c.to;
    }
    return vars;
  });

  // Content: webinar ka apna ho to wahi, nahi to category ka default
  readonly content = computed(() => {
    const w = this.webinar();
    if (!w) return null;
    const def = WEBINAR_CATEGORY_CONTENT[w.category];
    return {
      lead: w.lead || this.cat()?.blurb || '',
      body: w.body || WEBINAR_DEFAULT_BODY,
      aim: w.aim || def.aim,
      objectives: w.objectives?.length ? w.objectives : def.objectives,
      subjects: w.subjects?.length ? w.subjects : def.subjects,
    };
  });

  readonly tocItems = computed(() => [
    { id: 'wd-s0', label: this.text.aimTitle },
    { id: 'wd-s1', label: this.text.objectivesTitle },
    { id: 'wd-s2', label: this.text.subjectsTitle },
    { id: 'wd-s3', label: this.text.trainerTitle },
    { id: 'wd-ck', label: this.text.checklistTitle },
  ]);

  readonly trainerInitials = computed(() => {
    const name = this.webinar()?.trainer.name ?? '';
    const parts = name
      .replace(/^(Dr|Prof|MSc)\.?\s+/i, '')
      .split(/\s+/)
      .filter(Boolean);
    return parts
      .filter((_, i, a) => i === 0 || i === a.length - 1)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  });

  // Newer / older webinar
  readonly newer = computed(() => {
    const pos = this.ordered.findIndex((w) => w.id === this.id());
    return pos > 0 ? this.ordered[pos - 1] : null;
  });
  readonly older = computed(() => {
    const pos = this.ordered.findIndex((w) => w.id === this.id());
    return pos >= 0 ? (this.ordered[pos + 1] ?? null) : null;
  });

  // "More webinars": pehle same topic wale, phir baaki (3 tak)
  readonly related = computed(() => {
    const w = this.webinar();
    if (!w) return [];
    return MOCK_WEBINARS.filter((x) => x.id !== w.id)
      .sort(
        (a, b) =>
          Number(b.category === w.category) - Number(a.category === w.category) ||
          getWebinarStart(b) - getWebinarStart(a),
      )
      .slice(0, 3);
  });

  // Countdown (days / hrs / min / sec)
  readonly countdown = computed(() => {
    const secs = Math.max(0, Math.floor((this.startMs() - this.now()) / 1000));
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    return {
      d: String(Math.floor(secs / 86400)),
      h: pad(Math.floor((secs % 86400) / 3600)),
      m: pad(Math.floor((secs % 3600) / 60)),
      s: pad(secs % 60),
    };
  });

  readonly isRegistered = computed(() => this.registered().includes(this.id()));
  readonly isFav = computed(() => this.favIds().includes(this.id()));

  readonly readyLabel = computed(() => {
    const total = this.checked().length;
    const n = this.checked().filter(Boolean).length;
    return n === total
      ? this.text.allReady
      : this.text.readyText.replace('{n}', String(n)).replace('{total}', String(total));
  });

  readonly statusBadge = computed(() => {
    const s = this.status();
    return s === 'upcoming'
      ? this.text.badgeUpcoming
      : s === 'live'
        ? this.text.badgeLive
        : this.text.badgeRecorded;
  });

  readonly registerLabel = computed(() => {
    if (this.status() === 'recorded') return this.text.btnWatch;
    return this.isRegistered() ? this.text.btnRegistered : this.text.btnRegister;
  });

  // Google Calendar link
  readonly calendarUrl = computed(() => {
    const w = this.webinar();
    if (!w) return '';
    const fmt = (t: number) => new Date(t).toISOString().replace(/[-:]|\.\d{3}/g, '');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: 'Webinar: ' + w.title,
      dates: fmt(this.startMs()) + '/' + fmt(this.endMs()),
      details: 'GrantsforUS webinar',
    });
    return 'https://calendar.google.com/calendar/render?' + params.toString();
  });

  /* ---------- helpers (template me use hote hain) ---------- */
  catOf(w: Webinar): WebinarCategory {
    return this.catMap.get(w.category) as WebinarCategory;
  }

  // "Thursday, 29 October 2026"
  dateFull(ms: number): string {
    return new Date(ms).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  // "11:00 AM" (UTC)
  timeOf(ms: number): string {
    const d = new Date(ms);
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    return `${h % 12 || 12}:${m < 10 ? '0' + m : m} ${h < 12 ? 'AM' : 'PM'}`;
  }

  // Dekhne wale ke apne time zone me
  localTime(ms: number): string {
    try {
      return new Date(ms).toLocaleString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return '';
    }
  }

  /* ---------- actions ---------- */
  goTo(w: Webinar | null): void {
    if (w) this.router.navigate([WEBINAR_ROUTE_DETAIL, w.id]);
  }

  // Register / Watch recording button
  onRegister(): void {
    const w = this.webinar();
    if (!w) return;

    if (this.status() === 'recorded') {
      if (w.videoUrl) this.openUrl(w.videoUrl);
      else this.router.navigate([WEBINAR_ROUTE_VIDEOS]);
      return;
    }

    if (w.registerUrl) {
      this.openUrl(w.registerUrl);
      return;
    }

    const on = !this.isRegistered();
    this.registered.update((list) => (on ? [...list, w.id] : list.filter((x) => x !== w.id)));
    this.showToast(on ? this.text.registered : this.text.unregistered);
  }

  toggleFav(): void {
    const id = this.id();
    const on = !this.isFav();
    this.favIds.update((list) => (on ? [...list, id] : list.filter((x) => x !== id)));
    this.showToast(on ? 'Added to favorites' : 'Removed from favorites');
  }

  copyLink(): void {
    if (!this.isBrowser) return;
    navigator.clipboard
      .writeText(this.doc.location.href)
      .then(() => this.showToast(this.text.linkCopied))
      .catch(() => this.showToast(this.text.copyFailed));
  }

  toggleCheck(index: number): void {
    this.checked.update((list) => list.map((v, i) => (i === index ? !v : v)));
  }

  scrollToSection(sectionId: string, event: Event): void {
    event.preventDefault();
    if (!this.isBrowser) return;
    const el = this.doc.getElementById(sectionId);
    if (!el) return;
    const reduce = this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  private openUrl(url: string): void {
    if (this.isBrowser) this.doc.defaultView?.open(url, '_blank', 'noopener');
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2200);
  }

  /* ---------- scroll: progress bar + "On this page" highlight ---------- */
  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.isBrowser) return;
    const body = this.doc.getElementById('wd-body');
    const win = this.doc.defaultView;
    if (!body || !win) return;

    const r = body.getBoundingClientRect();
    const total = r.height - win.innerHeight * 0.5;
    this.progress.set(Math.max(0, Math.min(1, (-r.top + 80) / Math.max(total, 1))) * 100);

    let active = this.tocItems()[0].id;
    for (const item of this.tocItems()) {
      const el = this.doc.getElementById(item.id);
      if (el && el.getBoundingClientRect().top <= 140) active = item.id;
    }
    this.activeSection.set(active);
  }
}