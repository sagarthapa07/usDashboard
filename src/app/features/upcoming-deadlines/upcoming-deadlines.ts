import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownItem, GrantCardData } from '../../../datatype';
import {
  DEFAULT_ELIGIBILITY,
  MOCK_AREAS,
  MOCK_STATES,
  MOCK_UPCOMING_GRANTS,
} from '../../core/mock-data';
import { Pagination } from '../../shared/pagination/pagination';
import { Buttons } from '../../shared/buttons/buttons';
import { Router } from '@angular/router';

// Filter bar ki values
interface UpcomingFilter {
  state: string;
  area: string;
  from: string; // Deadline From
  to: string; // Deadline To
}

// Is page ke apne sort options
type UpcomingSort = 'due' | 'late' | 'new';

@Component({
  selector: 'app-upcoming-deadlines',
  imports: [FormsModule, DatePipe, Pagination, Buttons],
  templateUrl: './upcoming-deadlines.html',
  styleUrl: './upcoming-deadlines.scss',
})
export class UpcomingDeadline {
  constructor(private router: Router) {}
  /* =====================================================
     DATA
     ===================================================== */
  states: DropdownItem[] = MOCK_STATES;
  areas: DropdownItem[] = MOCK_AREAS;
  cards: GrantCardData[] = structuredClone(MOCK_UPCOMING_GRANTS);

  sortOptions: { key: UpcomingSort; label: string }[] = [
    { key: 'due', label: 'Deadline: soonest' },
    { key: 'late', label: 'Deadline: latest' },
    { key: 'new', label: 'Newest first' },
  ];

  // "Closing within" chips. days = 0 ka matlab "All upcoming"
  windows: { days: number; label: string }[] = [
    { days: 7, label: '7 days' },
    { days: 15, label: '15 days' },
    { days: 30, label: '30 days' },
    { days: 60, label: '60 days' },
    { days: 0, label: 'All upcoming' },
  ];

  /* =====================================================
     PAGE KI STATE
     ===================================================== */
  draft: UpcomingFilter = { state: '', area: '', from: '', to: '' };
  applied: UpcomingFilter = { state: '', area: '', from: '', to: '' };

  activeWindow = 0; // abhi kaun sa chip selected hai
  sortKey: UpcomingSort = 'due';
  selectedId: number | string | null = null;

  // "Remind me" dabaye hue grants
  reminders = new Set<number | string>();

  currentPage = 1;
  pageSize = 8;

  // Mobile state (sirf CSS se asar karta hai)
  filtersOpen = false;
  detailOpen = false;
  private listScroll = 0;

  /* =====================================================
     FILTER + SORT + PAGINATION
     ===================================================== */
  private get today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // Filter bar ki shartein (chips ke bina). Chips ki counting isi list par hoti hai.
  get baseCards(): GrantCardData[] {
    const f = this.applied;

    return this.cards.filter((c) => {
      if (c.deadline < this.today) return false; // nikal chuke grants nahi dikhane
      if (f.state && c.state !== f.state) return false;
      if (f.area && c.category !== f.area) return false;
      if (f.from && c.deadline < f.from) return false;
      if (f.to && c.deadline > f.to) return false;
      return true;
    });
  }

  // baseCards + chip + sort
  get filteredCards(): GrantCardData[] {
    const list = this.baseCards.filter(
      (c) => !this.activeWindow || this.daysLeft(c) <= this.activeWindow,
    );

    return list.sort((a, b) => {
      switch (this.sortKey) {
        case 'late':
          return b.deadline.localeCompare(a.deadline);
        case 'new':
          return (b.posted ?? '').localeCompare(a.posted ?? '');
        default:
          return a.deadline.localeCompare(b.deadline); // soonest first
      }
    });
  }

  get pagedCards(): GrantCardData[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCards.slice(start, start + this.pageSize);
  }

  // Jo grant select hai. Na mile to current page ki pehli grant
  get selected(): GrantCardData | null {
    const page = this.pagedCards;
    return page.find((c) => c.id === this.selectedId) ?? page[0] ?? null;
  }

  get activeFilterCount(): number {
    const f = this.applied;
    return [f.state, f.area, f.from, f.to].filter(Boolean).length;
  }

  // Chip ke andar ka number
  countFor(days: number): number {
    return this.baseCards.filter((c) => !days || this.daysLeft(c) <= days).length;
  }

  isSelected(g: GrantCardData): boolean {
    return this.selected?.id === g.id;
  }

  /* =====================================================
     DEADLINE ke helpers
     ===================================================== */
  daysLeft(g: GrantCardData): number {
    const diff = new Date(g.deadline).getTime() - new Date(this.today).getTime();
    return Math.max(0, Math.round(diff / 86400000));
  }

  // Urgency: u1 = laal (7 din ya kam), u2 = orange (15 din ya kam), u3 = neela
  urgency(g: GrantCardData): 'u1' | 'u2' | 'u3' {
    const d = this.daysLeft(g);
    return d <= 7 ? 'u1' : d <= 15 ? 'u2' : 'u3';
  }

  // Card par pill: "Closes today" / "1 day left" / "12 days left"
  leftLabel(g: GrantCardData): string {
    const d = this.daysLeft(g);
    if (d === 0) return 'Closes today';
    return d === 1 ? '1 day left' : `${d} days left`;
  }

  // Details me "Time left" box
  timeLeftShort(g: GrantCardData): string {
    const d = this.daysLeft(g);
    if (d === 0) return 'Today';
    return d === 1 ? '1 day' : `${d} days`;
  }

  // Details ke upar ka rangeen banner
  bannerText(g: GrantCardData): string {
    const d = this.daysLeft(g);
    const when = d === 0 ? 'Closes today' : d === 1 ? 'Closes in 1 day' : `Closes in ${d} days`;
    return `${when} · apply before ${this.formatDate(g.deadline)}`;
  }

  statusLabel(g: GrantCardData): string {
    return this.urgency(g) === 'u3' ? 'OPEN' : 'CLOSING SOON';
  }

  // Status ka rang: u1 = danger (laal), u2 = soon (orange), u3 = default (hara)
  statusClass(g: GrantCardData): string {
    const u = this.urgency(g);
    return u === 'u1' ? 'danger' : u === 'u2' ? 'soon' : '';
  }

  sourceLabel(g: GrantCardData): string {
    if (g.source === 'federal') return 'US Federal';
    if (g.source === 'foundation') return 'Private Foundation';
    return 'Funder';
  }

  eligibilityOf(g: GrantCardData): string[] {
    return g.eligibility?.length ? g.eligibility : DEFAULT_ELIGIBILITY;
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  /* =====================================================
     MOBILE helpers
     ===================================================== */
  private get isMobile(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  closeDetail(): void {
    this.detailOpen = false;
    setTimeout(() => window.scrollTo({ top: this.listScroll }), 0);
  }

  /* =====================================================
     EVENTS
     ===================================================== */
  onSearch(): void {
    this.applied = { ...this.draft };
    this.currentPage = 1;
    this.filtersOpen = false;
  }

  onReset(): void {
    this.draft = { state: '', area: '', from: '', to: '' };
    this.applied = { ...this.draft };
    this.activeWindow = 0;
    this.currentPage = 1;
  }

  onAdvanced(): void {
    console.log('Advanced Search'); // TODO: advanced search page ka route
  }

  setWindow(days: number): void {
    this.activeWindow = days;
    this.currentPage = 1;
  }

  onSort(v: UpcomingSort): void {
    this.sortKey = v;
    this.currentPage = 1;
  }

  onSelect(g: GrantCardData): void {
    this.selectedId = g.id;
    this.detailOpen = true;

    if (this.isMobile) {
      this.listScroll = window.scrollY;
      window.scrollTo({ top: 0 });
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  toggleSave(g: GrantCardData): void {
    g.isFav = !g.isFav;
  }

  isReminded(g: GrantCardData): boolean {
    return this.reminders.has(g.id);
  }

  toggleReminder(g: GrantCardData): void {
    if (this.reminders.has(g.id)) {
      this.reminders.delete(g.id);
    } else {
      this.reminders.add(g.id);
    }
  }

  onView(g: GrantCardData): void {
    this.router.navigate(['/grant', g.id]);
  }
}
