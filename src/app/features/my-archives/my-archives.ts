import { DatePipe, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ArchivedGrantItem, SortKey, SortOption } from '../../../datatype';
import { MOCK_MY_ARCHIVES } from '../../core/mock-data';

type FilterKey = 'all' | 'open' | 'closed';

@Component({
  selector: 'app-my-archives',
  imports: [FormsModule, NgClass, DatePipe],
  templateUrl: './my-archives.html',
  styleUrl: './my-archives.scss',
})
export class MyArchives {
  sortOptions: SortOption[] = [
    { key: 'newest', label: 'Recently archived' },
    { key: 'deadline', label: 'Deadline: soonest' },
    { key: 'title', label: 'Title: A to Z' },
  ];

  closingDays = 14; // itne din ya kam bache to chip orange dikhega

  // Baad me Api se aayega: this.api.getArchivedGrants()
  items: ArchivedGrantItem[] = MOCK_MY_ARCHIVES.map((x) => ({ ...x }));

  filter: FilterKey = 'all';
  keyword = '';
  sortKey: SortKey = 'newest';
  confirmId: string | number | null = null; // Delete ke liye 2-step confirm

  constructor(private router: Router) {}

  /* ---------- helpers ---------- */
  daysLeft(deadline: string): number {
    const today = new Date().toISOString().slice(0, 10);
    const ms =
      new Date(deadline + 'T00:00:00Z').getTime() - new Date(today + 'T00:00:00Z').getTime();
    return Math.round(ms / 86_400_000);
  }

  daysText(g: ArchivedGrantItem): string {
    const d = this.daysLeft(g.deadline);
    if (d < 0) return 'Closed';
    if (d === 0) return 'Closes today';
    return `${d} day${d > 1 ? 's' : ''} left`;
  }

  chipClass(g: ArchivedGrantItem): string {
    const d = this.daysLeft(g.deadline);
    if (d < 0) return 'expired';
    if (d <= this.closingDays) return 'soon';
    return 'ok';
  }

  /* ---------- stats ---------- */
  get openCount(): number {
    return this.items.filter((x) => this.daysLeft(x.deadline) >= 0).length;
  }

  get lastArchived(): ArchivedGrantItem | null {
    const sorted = [...this.items].sort((a, b) => b.archivedOn.localeCompare(a.archivedOn));
    return sorted[0] ?? null;
  }

  /* ---------- list ---------- */
  get filtered(): ArchivedGrantItem[] {
    const kw = this.keyword.trim().toLowerCase();

    const list = this.items.filter((x) => {
      const d = this.daysLeft(x.deadline);
      if (this.filter === 'open' && d < 0) return false;
      if (this.filter === 'closed' && d >= 0) return false;
      if (kw && !`${x.title} ${x.donor} ${x.category}`.toLowerCase().includes(kw)) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (this.sortKey === 'title') return a.title.localeCompare(b.title);
      if (this.sortKey === 'deadline') return a.deadline.localeCompare(b.deadline);
      return b.archivedOn.localeCompare(a.archivedOn);
    });
  }

  /* ---------- actions ---------- */
  setFilter(f: FilterKey): void {
    this.filter = f;
  }

  restore(g: ArchivedGrantItem): void {
    this.items = this.items.filter((x) => x.id !== g.id); // Baad me Api: restore to My Grants
  }

  // Pehle click par "Confirm?", dusre click par delete
  askDelete(g: ArchivedGrantItem): void {
    if (this.confirmId === g.id) {
      this.items = this.items.filter((x) => x.id !== g.id); // Baad me Api: delete permanently
      this.confirmId = null;
    } else {
      this.confirmId = g.id;
    }
  }

  viewGrant(g: ArchivedGrantItem): void {
    this.router.navigate(['/grant', g.grantId]);
  }

  goToMyGrants(): void {
    this.router.navigateByUrl('/my-grants');
  }
}
