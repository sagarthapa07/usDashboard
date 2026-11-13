import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { Api } from '../../core/api';
import { DropdownItem, DropdownType } from '../../../datatype';

export interface DropdownConfig {
  label: string;
  placeholder: string;
  searchable: boolean;
  options?: DropdownItem[]; // static ho to yahan, API nahi lagegi
}

export const DROPDOWN_CONFIG: Record<DropdownType, DropdownConfig> = {
  state: { label: 'State', placeholder: 'Select State...', searchable: true },
  area: { label: 'Area of Interest', placeholder: 'Select Area of Interest...', searchable: true },
  county: { label: 'County', placeholder: 'Select County...', searchable: true },
  donorCountry: { label: 'Donor Country', placeholder: 'Select Donor Country...', searchable: true },
  focusCountry: { label: 'Focus Country', placeholder: 'Select Focus Country...', searchable: true },
  date: {
    label: 'Date Filter',
    placeholder: 'Select Date...',
    searchable: false,
    options: [
      { id: 'all', name: 'Any time' },
      { id: '7d', name: 'Last 7 days' },
      { id: '30d', name: 'Last 30 days' },
      { id: '3m', name: 'Last 3 months' },
      { id: '6m', name: 'Last 6 months' },
      { id: '1y', name: 'Last 1 year' },
    ],
  },
  funding: {
    label: 'Funding Amount',
    placeholder: 'Select Funding Amount...',
    searchable: false,
    options: [
      { id: 'any', name: 'Any amount' },
      { id: 'lt-10k', name: 'Under $10,000' },
      { id: '10k-50k', name: '$10,000 – $50,000' },
      { id: '50k-100k', name: '$50,000 – $100,000' },
      { id: '100k-500k', name: '$100,000 – $500,000' },
      { id: '500k-1m', name: '$500,000 – $1M' },
      { id: 'gt-1m', name: 'Above $1M' },
    ],
  },
};

@Component({
  selector: 'app-filter-dropdown',
  standalone: true,
  templateUrl: './filter-dropdown.html',
  styleUrl: './filter-dropdown.scss',
})
export class FilterDropdown implements OnInit {
  /* ---------- Inputs / Outputs ---------- */
  type = input.required<DropdownType>();
  multiple = input(false);
  label = input<string>(); // default label override karna ho to
  placeholder = input<string>();
  selected = model<DropdownItem[]>([]); // [(selected)] two-way binding

  /* ---------- State ---------- */
  open = signal(false);
  loading = signal(false);
  error = signal(false);
  items = signal<DropdownItem[]>([]);
  query = signal('');

  config = computed(() => DROPDOWN_CONFIG[this.type()]);

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? this.items().filter((i) => i.name.toLowerCase().includes(q))
      : this.items();
  });

  display = computed(() => {
    const s = this.selected();
    if (!s.length) return '';
    return s.length === 1 ? s[0].name : `${s[0].name} +${s.length - 1}`;
  });

  // Select All: filtered list ke saare items selected hain ya nahi
  allSelected = computed(() => {
    const list = this.filtered();
    return list.length > 0 && list.every((i) => this.isSelected(i));
  });

  constructor(
    private api: Api,
    private host: ElementRef<HTMLElement>,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  /* =====================================================
     DATA LOAD
     Har type ka response yahan { id, name } me badalta hai
     ===================================================== */
  load(): void {
    // date / funding: static options, API nahi
    const options = this.config().options;
    if (options) {
      this.items.set(options);
      return;
    }

    this.loading.set(true);
    this.error.set(false);

    switch (this.type()) {
      case 'state':
        this.api.getStates().subscribe({
          next: (res) =>
            this.setItems(res.countries.map((c) => ({ id: c.countryid, name: c.countryname }))),
          error: (err) => this.setError(err),
        });
        break;

      case 'area':
        this.api.getIssues().subscribe({
          next: (res) => this.setItems(res.issues.map((i) => ({ id: i.id, name: i.issue }))),
          error: (err) => this.setError(err),
        });
        break;

      case 'county':
        this.api.getCounties().subscribe({
          // TODO: response ke hisaab se counties / id / name keys badalna
          next: (res) =>
            this.setItems((res.counties ?? []).map((c: any) => ({ id: c.id, name: c.name }))),
          error: (err) => this.setError(err),
        });
        break;

      case 'donorCountry':
        this.api.getDonorCountries().subscribe({
          // TODO: response ke hisaab se countries / id / name keys badalna
          next: (res) =>
            this.setItems((res.countries ?? []).map((c: any) => ({ id: c.id, name: c.name }))),
          error: (err) => this.setError(err),
        });
        break;

      case 'focusCountry':
        this.api.getFocusCountries().subscribe({
          // TODO: response ke hisaab se countries / id / name keys badalna
          next: (res) =>
            this.setItems((res.countries ?? []).map((c: any) => ({ id: c.id, name: c.name }))),
          error: (err) => this.setError(err),
        });
        break;
    }
  }

  private setItems(list: DropdownItem[]): void {
    this.items.set(list);
    this.loading.set(false);
  }

  private setError(err: unknown): void {
    console.error('Dropdown load nahi hua:', this.type(), err);
    this.error.set(true);
    this.loading.set(false);
  }

  /* =====================================================
     OPEN / CLOSE / SELECT
     ===================================================== */
  toggle(): void {
    this.open() ? this.close() : this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.query.set('');
  }

  isSelected(item: DropdownItem): boolean {
    return this.selected().some((s) => s.id === item.id);
  }

  select(item: DropdownItem): void {
    if (this.multiple()) {
      this.selected.set(
        this.isSelected(item)
          ? this.selected().filter((s) => s.id !== item.id)
          : [...this.selected(), item],
      );
    } else {
      this.selected.set([item]);
      this.close();
    }
  }

  // Select All / Unselect All (search lagi ho to sirf dikhne wale items par)
  toggleAll(): void {
    const list = this.filtered();

    if (this.allSelected()) {
      const ids = new Set(list.map((i) => i.id));
      this.selected.set(this.selected().filter((s) => !ids.has(s.id)));
    } else {
      const missing = list.filter((i) => !this.isSelected(i));
      this.selected.set([...this.selected(), ...missing]);
    }
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.selected.set([]);
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
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