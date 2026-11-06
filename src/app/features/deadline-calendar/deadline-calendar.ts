import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownItem, GrantCardData } from '../../../datatype';
import { MOCK_LATEST_GRANTS } from '../../core/mock-data';
import { Pagination } from '../../shared/pagination/pagination';
import { Buttons } from '../../shared/buttons/buttons';
import { Router } from '@angular/router';

type ViewMode = 'grid' | 'list' | 'calendar';
type SortKey = 'earliest' | 'latest' | 'funding' | 'newest';
type Urgency = 'u1' | 'u2' | 'u3';

interface Opt {
  value: string;
  label: string;
}

// Filter bar ki values
interface CalFilter {
  date: string;
  status: string;
  amount: string;
  from: string;
  to: string;
}

// Calendar ka ek din (day = null matlab khaali jagah)
interface CalCell {
  date: string;
  day: number | null;
  count: number;
  isToday: boolean;
}

// Local date -> YYYY-MM-DD (toISOString India me din galat kar deta hai)
function fmt(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function parse(s: string): Date {
  return new Date(s + 'T00:00:00');
}

function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return fmt(d);
}

// "$5,000–$25,000" / "Up to $40,000" -> sabse bada number
function maxAmount(text: string | undefined): number {
  const nums = [...(text ?? '').matchAll(/(\d[\d,]*\.?\d*)\s*([kKmM])?/g)].map((m) => {
    let n = parseFloat(m[1].replace(/,/g, ''));
    const u = (m[2] ?? '').toLowerCase();
    if (u === 'k') n *= 1e3;
    if (u === 'm') n *= 1e6;
    return n;
  });
  return nums.length ? Math.max(...nums) : 0;
}

@Component({
  selector: 'app-deadline-calendar',
  imports: [FormsModule, DatePipe, Pagination, Buttons],
  templateUrl: './deadline-calendar.html',
  styleUrl: './deadline-calendar.scss',
})
export class DeadlineCalendar {
  constructor(private router: Router) {}
  /* =====================================================
     DATA (baad me API se aayega)
     State / Area abhi is page me nahi hain, design me nahi the
     ===================================================== */
  cards: GrantCardData[] = structuredClone(MOCK_LATEST_GRANTS);

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  dateOptions: Opt[] = [
    { value: '', label: 'Any Date' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Next 7 days' },
    { value: 'month', label: 'Next 30 days' },
    { value: 'thisMonth', label: 'This month' },
    { value: 'quarter', label: 'Next 3 months' },
  ];

  statusOptions: Opt[] = [
    { value: '', label: 'All Statuses' },
    { value: 'soon', label: 'Closing Soon' },
    { value: 'open', label: 'Open' },
    { value: 'new', label: 'New' },
  ];

  amountOptions: Opt[] = [
    { value: '', label: 'Any Amount' },
    { value: 'under50', label: 'Under $50K' },
    { value: 'mid', label: '$50K – $250K' },
    { value: 'high', label: '$250K – $1M' },
    { value: 'huge', label: '$1M +' },
  ];

  sortOptions: { key: SortKey; label: string }[] = [
    { key: 'earliest', label: 'Deadline (Earliest)' },
    { key: 'latest', label: 'Deadline (Latest)' },
    { key: 'funding', label: 'Funding (High to Low)' },
    { key: 'newest', label: 'Newest posted' },
  ];

  views: { key: ViewMode; label: string }[] = [
    { key: 'grid', label: 'Grid' },
    { key: 'list', label: 'List' },
    { key: 'calendar', label: 'Calendar' },
  ];

  /* =====================================================
     PAGE KI STATE
     ===================================================== */
  // draft = form me abhi jo chun rahe ho, applied = Search dabane ke baad
  draft: CalFilter = { date: '', status: '', amount: '', from: '', to: '' };
  applied: CalFilter = { date: '', status: '', amount: '', from: '', to: '' };

  viewMode: ViewMode = 'grid';
  sortKey: SortKey = 'earliest';

  currentPage = 1;
  pageSize = 12;

  private now = new Date();
  viewYear = this.now.getFullYear();
  viewMonth = this.now.getMonth(); // 0 = Jan
  selectedDate: string | null = null;

  filtersOpen = false; // mobile par filter bar
  searchSaved = false;

  /* =====================================================
     DATES
     ===================================================== */
  get today(): string {
    return fmt(new Date());
  }

  daysLeft(g: GrantCardData): number {
    return this.daysBetween(g.deadline ?? this.today);
  }

  private daysBetween(date: string): number {
    return Math.round((parse(date).getTime() - parse(this.today).getTime()) / 86400000);
  }

  // Design jaisa: 7 din tak red, 15 din tak orange, baaki blue
  urgencyOfDays(d: number): Urgency {
    if (d <= 7) return 'u1';
    if (d <= 15) return 'u2';
    return 'u3';
  }

  urgency(g: GrantCardData): Urgency {
    return this.urgencyOfDays(this.daysLeft(g));
  }

  urgencyOfDate(date: string): Urgency {
    return this.urgencyOfDays(this.daysBetween(date));
  }

  leftLabel(g: GrantCardData): string {
    const d = this.daysLeft(g);
    if (d <= 0) return 'Today';
    return d === 1 ? '1 day left' : `${d} days left`;
  }

  // "Deadline Date" dropdown ki range
  private presetRange(p: string): [string, string] {
    const t = this.today;
    const d = parse(t);
    switch (p) {
      case 'today':
        return [t, t];
      case 'week':
        return [t, addDays(t, 7)];
      case 'month':
        return [t, addDays(t, 30)];
      case 'quarter':
        return [t, addDays(t, 90)];
      case 'thisMonth':
        return [t, fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0))];
      default:
        return ['', ''];
    }
  }

  /* =====================================================
     FILTER + SORT + PAGINATION
     ===================================================== */
  get filteredCards(): GrantCardData[] {
    const f = this.applied;
    const [rf, rt] = this.presetRange(f.date);

    const list = this.cards.filter((c) => {
      const dl = c.deadline;
      if (!dl || dl < this.today) return false; // sirf upcoming

      if (rf && dl < rf) return false;
      if (rt && dl > rt) return false;
      if (f.from && dl < f.from) return false;
      if (f.to && dl > f.to) return false;

      const days = this.daysLeft(c);
      if (f.status === 'soon' && days > 7) return false;
      if (f.status === 'open' && days <= 7) return false;
      if (f.status === 'new' && !c.isNew) return false;

      const amt = maxAmount(c.amount);
      if (f.amount === 'under50' && amt >= 50000) return false;
      if (f.amount === 'mid' && (amt < 50000 || amt >= 250000)) return false;
      if (f.amount === 'high' && (amt < 250000 || amt >= 1000000)) return false;
      if (f.amount === 'huge' && amt < 1000000) return false;

      return true;
    });

    return list.sort((a, b) => {
      switch (this.sortKey) {
        case 'latest':
          return (b.deadline ?? '').localeCompare(a.deadline ?? '');
        case 'funding':
          return maxAmount(b.amount) - maxAmount(a.amount);
        case 'newest':
          return (b.posted ?? '').localeCompare(a.posted ?? '');
        default:
          return (a.deadline ?? '').localeCompare(b.deadline ?? '');
      }
    });
  }

  get pagedCards(): GrantCardData[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCards.slice(start, start + this.pageSize);
  }

  get activeFilterCount(): number {
    return this.chipsList.length;
  }

  // "Selected Filters" bar ke chips
  get chipsList(): { key: keyof CalFilter | 'range'; label: string }[] {
    const f = this.draft;
    const out: { key: keyof CalFilter | 'range'; label: string }[] = [];
    const lbl = (opts: Opt[], v: string) => opts.find((o) => o.value === v)?.label ?? v;

    if (f.date) out.push({ key: 'date', label: lbl(this.dateOptions, f.date) });
    if (f.status) out.push({ key: 'status', label: lbl(this.statusOptions, f.status) });
    if (f.amount) out.push({ key: 'amount', label: lbl(this.amountOptions, f.amount) });
    if (f.from || f.to) out.push({ key: 'range', label: this.rangeLabel(f.from, f.to) });
    return out;
  }

  private rangeLabel(from: string, to: string): string {
    const show = (s: string) =>
      parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (from && to) return `${show(from)} – ${show(to)}`;
    return from ? `From ${show(from)}` : `Until ${show(to)}`;
  }

  /* =====================================================
     CALENDAR
     ===================================================== */
  get monthLabel(): string {
    return new Date(this.viewYear, this.viewMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  get cells(): CalCell[] {
    // date -> kitne grants
    const counts = new Map<string, number>();
    for (const c of this.filteredCards) {
      const k = c.deadline ?? '';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    const offset = new Date(this.viewYear, this.viewMonth, 1).getDay();
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const out: CalCell[] = [];

    for (let i = 0; i < offset; i++) {
      out.push({ date: '', day: null, count: 0, isToday: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = fmt(new Date(this.viewYear, this.viewMonth, d));
      out.push({ date, day: d, count: counts.get(date) ?? 0, isToday: date === this.today });
    }
    return out;
  }

  // Calendar me kisi din par click karne par us din ke grants
  get selectedItems(): GrantCardData[] {
    return this.filteredCards.filter((c) => c.deadline === this.selectedDate);
  }

  prevMonth(): void {
    this.shiftMonth(-1);
  }

  nextMonth(): void {
    this.shiftMonth(1);
  }

  private shiftMonth(by: number): void {
    const d = new Date(this.viewYear, this.viewMonth + by, 1);
    this.viewYear = d.getFullYear();
    this.viewMonth = d.getMonth();
  }

  goToday(): void {
    const d = new Date();
    this.viewYear = d.getFullYear();
    this.viewMonth = d.getMonth();
    this.selectedDate = fmt(d);
  }

  selectDay(cell: CalCell): void {
    if (!cell.day) return;
    if (this.selectedDate === cell.date) {
      this.selectedDate = null;
      return;
    }
    this.selectedDate = cell.date;
    setTimeout(() =>
      document.getElementById('dc-day')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }

  /* =====================================================
     EVENTS
     ===================================================== */
  setView(v: ViewMode): void {
    this.viewMode = v;
    this.currentPage = 1;
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  onSearch(): void {
    this.applied = { ...this.draft };
    this.currentPage = 1;
    this.filtersOpen = false;
  }

  onReset(): void {
    this.draft = { date: '', status: '', amount: '', from: '', to: '' };
    this.applied = { ...this.draft };
    this.currentPage = 1;
  }

  removeChip(key: keyof CalFilter | 'range'): void {
    if (key === 'range') {
      this.draft.from = this.draft.to = '';
      this.applied.from = this.applied.to = '';
    } else {
      this.draft[key] = '';
      this.applied[key] = '';
    }
    this.currentPage = 1;
  }

  clearAll(): void {
    this.onReset();
  }

  onAdvanced(): void {
    console.log('Advanced Search'); // TODO: advanced search page ka route
  }

  saveSearch(): void {
    this.searchSaved = !this.searchSaved;
    console.log('Save search:', this.applied); // TODO: saved search API
  }

  onSort(v: SortKey): void {
    this.sortKey = v;
    this.currentPage = 1;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  toggleFav(g: GrantCardData, event: Event): void {
    event.stopPropagation();
    g.isFav = !g.isFav;
  }

  onView(g: GrantCardData): void {
    this.router.navigate(['/grant', g.id]);
  }
}
