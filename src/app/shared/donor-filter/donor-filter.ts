import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DonorFilterKey,
  DonorFilterSection,
  DonorFilterValue,
  DonorPopularSearch,
} from '../../../datatype';
import { DONOR_FILTER_SECTIONS } from '../../core/mock-data'; // apne path ke hisaab se

@Component({
  selector: 'app-donor-filter',
  imports: [FormsModule],
  templateUrl: './donor-filter.html',
  styleUrl: './donor-filter.scss',
})
export class DonorFilter {
  /* ----- Parent se aayenge ----- */
  @Input() countries: string[] = [];
  @Input() focuses: string[] = [];
  @Input() areas: string[] = [];
  @Input() popular: DonorPopularSearch[] = [];
  @Input() value: DonorFilterValue = { countries: [], focuses: [], areas: [] };
  @Input() filterTitle = 'Search filters';
  @Input() popularTitle = 'Popular searches';

  /* ----- Parent ko jayega ----- */
  @Output() valueChange = new EventEmitter<DonorFilterValue>();
  @Output() popularPick = new EventEmitter<DonorPopularSearch>();

  sections: DonorFilterSection[] = DONOR_FILTER_SECTIONS;

  /* Kaunsa section khula hai */
  open: Record<DonorFilterKey, boolean> = {
    countries: true,
    focuses: false,
    areas: true,
  };

  /* Har section ka search box */
  search: Record<DonorFilterKey, string> = {
    countries: '',
    focuses: '',
    areas: '',
  };

  get totalActive(): number {
    return this.value.countries.length + this.value.focuses.length + this.value.areas.length;
  }

  toggleSection(key: DonorFilterKey): void {
    this.open[key] = !this.open[key];
  }

  /* Search se filter hui list */
  listFor(key: DonorFilterKey): string[] {
    const source = key === 'countries' ? this.countries : key === 'focuses' ? this.focuses : this.areas;
    const q = this.search[key].trim().toLowerCase();
    return q ? source.filter((x) => x.toLowerCase().includes(q)) : source;
  }

  /* Checkbox tick / untick */
  toggle(key: DonorFilterKey, item: string): void {
    const current = this.value[key];
    const next = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
    this.valueChange.emit({ ...this.value, [key]: next });
  }

  clearAll(): void {
    this.search = { countries: '', focuses: '', areas: '' };
    this.valueChange.emit({ countries: [], focuses: [], areas: [] });
  }
}