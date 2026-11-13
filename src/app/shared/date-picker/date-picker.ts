import {
  Component,
  ElementRef,
  HostListener,
  computed,
  input,
  model,
  signal,
} from '@angular/core';

interface CalendarDay {
  date: string; // 'YYYY-MM-DD'
  day: number;
  inMonth: boolean; // is month ki date hai ya pichle/agle month ki
  disabled: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

@Component({
  selector: 'app-date-picker',
  standalone: true,
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
})
export class DatePicker {
  /* ---------- Inputs / Outputs ---------- */
  label = input('');
  placeholder = input('Select date...');
  min = input(''); // 'YYYY-MM-DD', isse pehle ki dates disabled
  max = input(''); // 'YYYY-MM-DD', isse baad ki dates disabled
  alignRight = input(false); // popup right edge se align (screen ke kinare wale field ke liye)
  value = model(''); // [(value)] two-way binding, 'YYYY-MM-DD'

  /* ---------- State ---------- */
  open = signal(false);
  viewYear = signal(new Date().getFullYear());
  viewMonth = signal(new Date().getMonth()); // 0 = January

  weekdays = WEEKDAYS;
  today = this.toStr(new Date());

  // Month dropdown: Jan, Feb, ...
  months = MONTHS.map((name, index) => ({ index, short: name.slice(0, 3) }));

  // Year dropdown: pichle 30 saal se agle 10 saal tak
  years: number[] = Array.from(
    { length: 41 },
    (_, i) => new Date().getFullYear() - 30 + i,
  );

  // Trigger me dikhne wali date: "Dec 4, 2026"
  display = computed(() => {
    const v = this.value();
    if (!v) return '';
    const [y, m, d] = v.split('-').map(Number);
    return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
  });

  // Calendar grid: hamesha 6 hafte (42 din), week Monday se shuru
  days = computed(() => {
    const y = this.viewYear();
    const m = this.viewMonth();
    const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7; // Mon = 0
    const list: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(y, m, 1 - firstWeekday + i);
      const date = this.toStr(d);
      list.push({
        date,
        day: d.getDate(),
        inMonth: d.getMonth() === m,
        disabled: this.isDisabled(date),
      });
    }
    return list;
  });

  constructor(private host: ElementRef<HTMLElement>) {}

  /* =====================================================
     HELPERS
     ===================================================== */
  private toStr(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private isDisabled(date: string): boolean {
    if (this.min() && date < this.min()) return true;
    if (this.max() && date > this.max()) return true;
    return false;
  }

  /* =====================================================
     OPEN / CLOSE
     ===================================================== */
  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }

    // Khulte waqt selected date wala month dikhao, nahi to aaj ka
    const base = this.value() || this.today;
    const [y, m] = base.split('-').map(Number);
    this.viewYear.set(y);
    this.viewMonth.set(m - 1);
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }

  /* =====================================================
     MONTH / YEAR NAVIGATION
     ===================================================== */
  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.set(this.viewYear() - 1);
    } else {
      this.viewMonth.set(this.viewMonth() - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.set(this.viewYear() + 1);
    } else {
      this.viewMonth.set(this.viewMonth() + 1);
    }
  }

  onMonthChange(event: Event): void {
    this.viewMonth.set(Number((event.target as HTMLSelectElement).value));
  }

  onYearChange(event: Event): void {
    this.viewYear.set(Number((event.target as HTMLSelectElement).value));
  }

  /* =====================================================
     SELECT
     ===================================================== */
  pick(day: CalendarDay): void {
    if (day.disabled) return;
    this.value.set(day.date);
    this.close();
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.value.set('');
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.close();
  }
}