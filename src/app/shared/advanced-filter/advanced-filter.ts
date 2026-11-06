import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdvancedFilterValue, DropdownItem } from '../../../datatype';

type SectionKey = 'date' | 'states' | 'areas' | 'size' | 'donor';

@Component({
  selector: 'app-advanced-filter',
  imports: [FormsModule],
  templateUrl: './advanced-filter.html',
  styleUrl: './advanced-filter.scss',
})
export class AdvancedFilter {
  /* ----- Parent se aayenge (API ya dummy data) ----- */
  @Input() states: DropdownItem[] = [];
  @Input() areas: DropdownItem[] = [];
  @Input() donors: DropdownItem[] = [];

  /* ----- Parent ko jayega ----- */
  @Output() filterChange = new EventEmitter<AdvancedFilterValue>();

  /* Grant size ke options (label screen par, key filter me) */
  grantSizes = [
    { key: 'na', label: 'Not Available' },
    { key: 'lt10k', label: 'Up to $10,000' },
    { key: '10k-100k', label: '$10,000 to $100,000' },
    { key: '100k-500k', label: '$100,000 to $500,000' },
    { key: '500k-1m', label: '$500,000 to $1 million' },
    { key: 'gt1m', label: 'More than $1 million' },
  ];

  /* Kaunsa section khula hai */
  open: Record<SectionKey, boolean> = {
    date: true,
    states: true,
    areas: true,
    size: true,
    donor: false,
  };

  /* Section ke andar ke search boxes */
  stateSearch = '';
  areaSearch = '';
  donorSearch = '';

  filter: AdvancedFilterValue = this.emptyFilter();

  /* ----- Search se filter hui lists ----- */
  get filteredStates(): DropdownItem[] {
    return this.match(this.states, this.stateSearch);
  }

  get filteredAreas(): DropdownItem[] {
    return this.match(this.areas, this.areaSearch);
  }

  get filteredDonors(): DropdownItem[] {
    return this.match(this.donors, this.donorSearch);
  }

  /* ----- Har section me kitne selected hain (chhota count badge) ----- */
  get dateCount(): number {
    return (this.filter.from ? 1 : 0) + (this.filter.to ? 1 : 0);
  }

  get totalActive(): number {
    return (
      this.dateCount +
      this.filter.states.length +
      this.filter.areas.length +
      this.filter.grantSizes.length +
      this.filter.donors.length
    );
  }

  toggleSection(key: SectionKey): void {
    this.open[key] = !this.open[key];
  }

  isChecked(list: (string | number)[], id: string | number): boolean {
    return list.includes(id);
  }

  /* Checkbox tick / untick */
  toggleItem(list: (string | number)[], id: string | number): void {
    const i = list.indexOf(id);
    if (i >= 0) {
      list.splice(i, 1);
    } else {
      list.push(id);
    }
    this.emitChange();
  }

  toggleSize(key: string): void {
    const list = this.filter.grantSizes;
    const i = list.indexOf(key);
    if (i >= 0) {
      list.splice(i, 1);
    } else {
      list.push(key);
    }
    this.emitChange();
  }

  setDateBy(value: string): void {
    this.filter.dateBy = value;
    this.emitChange();
  }

  setFrom(value: string): void {
    this.filter.from = value;
    this.emitChange();
  }

  setTo(value: string): void {
    this.filter.to = value;
    this.emitChange();
  }

  clearAll(): void {
    this.filter = this.emptyFilter();
    this.stateSearch = '';
    this.areaSearch = '';
    this.donorSearch = '';
    this.emitChange();
  }

  private emitChange(): void {
    this.filterChange.emit({
      ...this.filter,
      states: [...this.filter.states],
      areas: [...this.filter.areas],
      grantSizes: [...this.filter.grantSizes],
      donors: [...this.filter.donors],
    });
  }

  private match(list: DropdownItem[], q: string): DropdownItem[] {
    const text = q.trim().toLowerCase();
    return text ? list.filter((x) => x.name.toLowerCase().includes(text)) : list;
  }

  private emptyFilter(): AdvancedFilterValue {
    return { dateBy: 'post', from: '', to: '', states: [], areas: [], grantSizes: [], donors: [] };
  }
}