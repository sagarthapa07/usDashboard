import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { Course, CourseCategory, CourseLesson } from '../../../datatype';
import {
  COURSE_CATEGORIES,
  COURSE_DETAIL_TEXT,
  COURSE_QUICK_MINUTES,
  COURSE_ROUTE_DETAIL,
  COURSE_ROUTE_LIST,
  MOCK_COURSES,
  getCourse,
  getCourseLessons,
  getCourseOutcomes,
  getCourseProgress,
  getInitials,
  getSavedCourseIds,
  setCourseProgress,
  setSavedCourseIds,
} from '../../core/mock-data';

@Component({
  selector: 'app-course-detail',
  imports: [RouterLink],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.scss',
})
export class CourseDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly text = COURSE_DETAIL_TEXT;
  readonly listRoute = COURSE_ROUTE_LIST;

  // Baad me Api se aayega: this.api.getCourse(id)
  readonly loading = signal(false);

  // URL se id (/course/:id)
  private readonly courseId = toSignal(this.route.paramMap.pipe(map((p) => Number(p.get('id')))), {
    initialValue: NaN,
  });

  readonly course = computed<Course | null>(() => getCourse(this.courseId()));
  readonly cat = computed<CourseCategory | null>(() => {
    const c = this.course();
    return c ? (COURSE_CATEGORIES.find((x) => x.key === c.category) ?? null) : null;
  });

  // Colour theme (CSS variables)
  readonly themeVars = computed<Record<string, string>>(() => {
    const c = this.cat();
    const vars: Record<string, string> = {};
    if (c) {
      vars['--c'] = c.color;
      vars['--t'] = c.tint;
      vars['--g1'] = c.from;
      vars['--g2'] = c.to;
    }
    return vars;
  });

  readonly lessons = computed<CourseLesson[]>(() => {
    const c = this.course();
    return c ? getCourseLessons(c) : [];
  });
  readonly outcomes = computed<string[]>(() => {
    const c = this.course();
    return c ? getCourseOutcomes(c) : [];
  });
  readonly trainerInitials = computed(() => getInitials(this.course()?.trainer.name ?? ''));

  // Previous / next course (list ke order me)
  private readonly index = computed(() => MOCK_COURSES.findIndex((x) => x.id === this.courseId()));
  readonly prevCourse = computed(() => MOCK_COURSES[this.index() - 1] ?? null);
  readonly nextCourse = computed(() => MOCK_COURSES[this.index() + 1] ?? null);

  // Sidebar "More courses": pehle same trainer, phir same category
  readonly related = computed(() => {
    const c = this.course();
    if (!c) return [];
    return MOCK_COURSES.filter((x) => x.id !== c.id)
      .sort(
        (x, y) =>
          Number(y.trainer.name === c.trainer.name) - Number(x.trainer.name === c.trainer.name) ||
          Number(y.category === c.category) - Number(x.category === c.category) ||
          x.id - y.id,
      )
      .slice(0, 3);
  });

  // Progress + saved (is course ki)
  readonly started = signal(false);
  readonly done = signal<number[]>([]);
  readonly saved = signal(false);

  readonly pct = computed(() => {
    const n = this.lessons().length;
    return n ? Math.round((this.done().length / n) * 100) : 0;
  });
  readonly isComplete = computed(
    () => this.lessons().length > 0 && this.done().length >= this.lessons().length,
  );
  readonly unit = computed(() =>
    this.lessons().length > 1 ? this.text.lessonPlural : this.text.lessonSingular,
  );
  readonly progressText = computed(() =>
    this.text.progressText
      .replace('{n}', String(this.done().length))
      .replace('{total}', String(this.lessons().length))
      .replace('{unit}', this.unit()),
  );
  readonly startLabel = computed(() =>
    this.isComplete()
      ? this.text.btnReview
      : this.started() || this.done().length
        ? this.text.btnContinue
        : this.text.btnStart,
  );
  readonly ctaSub = computed(() =>
    this.text.ctaSub.replace('{min}', String(this.course()?.minutes ?? '')),
  );

  // "On this page"
  readonly tocItems = computed(() => [
    { id: 'cd-s0', label: this.text.introTitle },
    { id: 'cd-s1', label: this.text.learnTitle },
    { id: 'cd-s2', label: this.text.lessonsTitle },
    { id: 'cd-s3', label: this.text.trainerTitle },
  ]);

  // Scroll state + toast
  readonly readProgress = signal(0);
  readonly activeSection = signal('cd-s0');
  readonly toast = signal('');
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Course badalte hi (URL change) uski progress / saved load karo aur upar le jao
    effect(() => {
      const c = this.course();
      if (!c) return;
      const p = getCourseProgress(c.id);
      this.started.set(p.started);
      this.done.set(p.done);
      this.saved.set(getSavedCourseIds().includes(c.id));
      window.scrollTo({ top: 0 });
      setTimeout(() => this.onScroll());
    });
  }

  /* ---------- helpers (template me use hote hain) ---------- */
  isQuick(c: Course): boolean {
    return c.minutes <= COURSE_QUICK_MINUTES;
  }

  catOf(c: Course): CourseCategory {
    return COURSE_CATEGORIES.find((x) => x.key === c.category) as CourseCategory;
  }

  isDone(i: number): boolean {
    return this.done().includes(i);
  }

  /* ---------- actions ---------- */
  start(): void {
    const c = this.course();
    if (!c) return;
    if (!this.started()) {
      this.started.set(true);
      this.persist(c.id);
      this.showToast(this.text.toastStarted);
    }
    this.scrollToId('cd-s2');
  }

  toggleLesson(i: number): void {
    const c = this.course();
    if (!c) return;
    this.started.set(true);
    this.done.set(this.isDone(i) ? this.done().filter((x) => x !== i) : [...this.done(), i]);
    this.persist(c.id);
    if (this.isComplete()) this.showToast(this.text.toastDone);
  }

  toggleSave(): void {
    const c = this.course();
    if (!c) return;
    const ids = getSavedCourseIds();
    const on = !this.saved();
    setSavedCourseIds(on ? [...ids, c.id] : ids.filter((id) => id !== c.id));
    this.saved.set(on);
    this.showToast(on ? this.text.toastSaved : this.text.toastUnsaved);
  }

  copyLink(): void {
    try {
      navigator.clipboard.writeText(location.href).then(
        () => this.showToast(this.text.linkCopied),
        () => this.showToast(this.text.copyFailed),
      );
    } catch {
      this.showToast(this.text.copyFailed);
    }
  }

  goTo(c: Course | null): void {
    if (c) this.router.navigate([COURSE_ROUTE_DETAIL, c.id]);
  }

  scrollToSection(id: string, event: Event): void {
    event.preventDefault();
    this.scrollToId(id);
  }

  /* ---------- scroll: reading bar + "On this page" highlight ---------- */
  @HostListener('window:scroll')
  onScroll(): void {
    const body = document.getElementById('cd-body');
    if (!body) return;

    const r = body.getBoundingClientRect();
    const total = r.height - window.innerHeight * 0.5;
    this.readProgress.set(Math.max(0, Math.min(1, (-r.top + 80) / Math.max(total, 1))) * 100);

    let on = this.tocItems()[0].id;
    for (const item of this.tocItems()) {
      const el = document.getElementById(item.id);
      if (el && el.getBoundingClientRect().top <= 140) on = item.id;
    }
    this.activeSection.set(on);
  }

  /* ---------- private ---------- */
  private persist(id: number): void {
    setCourseProgress(id, { started: this.started(), done: this.done() });
  }

  private scrollToId(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2400);
  }
}
