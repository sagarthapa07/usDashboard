import { Component, ElementRef, computed, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';

import {
  Course,
  CourseCategory,
  CourseCategoryKey,
  CourseFilterKey,
  CourseSortKey,
} from '../../../datatype';
import {
  COURSE_CATEGORIES,
  COURSE_DEFAULT_PAGE_SIZE,
  COURSE_PAGE_SIZES,
  COURSE_PAGE_TEXT,
  COURSE_QUICK_MINUTES,
  COURSE_ROUTE_DETAIL,
  COURSE_SORT_OPTIONS,
  COURSE_STATS,
  MOCK_COURSES,
  getInitials,
  getSavedCourseIds,
  setSavedCourseIds,
} from '../../core/mock-data';
import { Pagination } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-courses',
  imports: [NgTemplateOutlet, Pagination],
  templateUrl: './courses.html',
  styleUrl: './courses.scss',
})
export class Courses {
  constructor(
    private router: Router,
    private host: ElementRef<HTMLElement>,
  ) {}

  // Text / config (sab mock-data.ts se)
  readonly text = COURSE_PAGE_TEXT;
  readonly categories = COURSE_CATEGORIES;
  readonly sortOptions = COURSE_SORT_OPTIONS;
  readonly pageSizes = COURSE_PAGE_SIZES;

  // Baad me Api se aayega: this.api.getCourses()
  readonly courses = signal<Course[]>(MOCK_COURSES.map((c) => ({ ...c })));
  readonly loading = signal(false);

  // Page ki state
  readonly category = signal<CourseFilterKey>('all');
  readonly query = signal('');
  readonly sort = signal<CourseSortKey>('recommended');
  readonly page = signal(1);
  readonly pageSize = signal(COURSE_DEFAULT_PAGE_SIZE);

  // Saved (bookmark) courses
  readonly saved = signal<number[]>(getSavedCourseIds());

  private readonly catMap = new Map<CourseFilterKey, CourseCategory>(
    COURSE_CATEGORIES.map((c) => [c.key, c]),
  );

  // Hero ke stats ("32 Courses", "2 Trainers", "30 Hours")
  readonly statCards = computed(() => {
    const list = this.courses();
    const trainers = new Set(list.map((c) => c.trainer.name)).size;
    const hours = Math.floor(list.reduce((sum, c) => sum + c.minutes, 0) / 60);
    return COURSE_STATS.map((s) => ({
      ...s,
      title: s.title
        .replace('{count}', String(list.length))
        .replace('{trainers}', String(trainers))
        .replace('{hours}', String(hours)),
    }));
  });

  // "Quickest to finish" card: sabse chhota course (filter ka asar nahi padta)
  readonly featuredCourse = computed(() => {
    const list = this.courses();
    return list.length ? list.reduce((p, c) => (c.minutes < p.minutes ? c : p), list[0]) : null;
  });

  // Search + topic chip + sort
  readonly filtered = computed(() => {
    const cat = this.category();
    const q = this.query().trim().toLowerCase();

    const list = this.courses().filter((c) => {
      if (cat !== 'all' && c.category !== cat) return false;
      if (!q) return true;
      const hay = (c.title + ' ' + c.trainer.name + ' ' + this.getCat(c.category).label).toLowerCase();
      return hay.includes(q);
    });

    return list.sort((a, b) => {
      switch (this.sort()) {
        case 'shortest':
          return a.minutes - b.minutes;
        case 'longest':
          return b.minutes - a.minutes;
        case 'az':
          return a.title.localeCompare(b.title);
        default:
          return a.id - b.id;
      }
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
  );
  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  readonly pageItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });
  readonly noResults = computed(() => this.filtered().length === 0);

  // "Showing 1–8 of 32 courses"
  readonly rangeFrom = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  readonly rangeTo = computed(() => this.rangeFrom() + this.pageItems().length - 1);

  /* ---------- helpers (template me use hote hain) ---------- */
  getCat(key: CourseCategoryKey): CourseCategory {
    return this.catMap.get(key) as CourseCategory;
  }

  // Card ka colour theme (CSS variables)
  vars(c: CourseCategory): Record<string, string> {
    return { '--c': c.color, '--t': c.tint, '--g1': c.from, '--g2': c.to };
  }

  summaryOf(c: Course): string {
    return c.summary || this.getCat(c.category).blurb;
  }

  isQuick(c: Course): boolean {
    return c.minutes <= COURSE_QUICK_MINUTES;
  }

  initials(name: string): string {
    return getInitials(name);
  }

  trainerColor(c: Course): string {
    return c.trainer.color ?? this.getCat(c.category).color;
  }

  isSaved(c: Course): boolean {
    return this.saved().includes(c.id);
  }

  /* ---------- filter actions ---------- */
  setCategory(key: CourseFilterKey): void {
    this.category.set(key);
    this.page.set(1);
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  onSort(value: string): void {
    this.sort.set(value as CourseSortKey);
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
  toggleSave(c: Course, event: Event): void {
    event.stopPropagation(); // card open na ho
    const next = this.isSaved(c) ? this.saved().filter((id) => id !== c.id) : [...this.saved(), c.id];
    this.saved.set(next);
    setSavedCourseIds(next);
  }

  open(c: Course): void {
    this.router.navigate([COURSE_ROUTE_DETAIL, c.id]);
  }
}