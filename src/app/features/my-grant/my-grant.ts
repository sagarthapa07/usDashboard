import { DatePipe, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SavedGrantItem, SortKey } from '../../../datatype';
import {
  MOCK_MY_GRANTS,
  MY_GRANT_SORT_OPTIONS,
  MY_GRANTS_CLOSING_DAYS,
} from '../../core/mock-data';

type FilterKey = 'all' | 'closing';

@Component({
  selector: 'app-my-grant',
  imports: [FormsModule, NgClass, DatePipe],
  templateUrl: './my-grant.html',
  styleUrl: './my-grant.scss',
})
export class MyGrant {
  sortOptions = MY_GRANT_SORT_OPTIONS;
  closingDays = MY_GRANTS_CLOSING_DAYS;

  // Baad me Api se aayega: this.api.getSavedGrants()
  items: SavedGrantItem[] = MOCK_MY_GRANTS.map((x) => ({ ...x }));

  filter: FilterKey = 'all';
  keyword = '';
  sortKey: SortKey = 'deadline';

  constructor(private router: Router) {}

  /* ---------- helpers ---------- */
  daysLeft(deadline: string): number {
    const today = new Date().toISOString().slice(0, 10);
    const ms =
      new Date(deadline + 'T00:00:00Z').getTime() - new Date(today + 'T00:00:00Z').getTime();
    return Math.round(ms / 86_400_000);
  }

  daysText(g: SavedGrantItem): string {
    const d = this.daysLeft(g.deadline);
    if (d < 0) return 'Expired';
    if (d === 0) return 'Closes today';
    return `${d} day${d > 1 ? 's' : ''} left`;
  }

  chipClass(g: SavedGrantItem): string {
    const d = this.daysLeft(g.deadline);
    if (d < 0) return 'expired';
    if (d <= this.closingDays) return 'soon';
    return 'ok';
  }

  thumbIcon(g: SavedGrantItem): string {
    return { bank: 'bi-bank', star: 'bi-star', edu: 'bi-mortarboard' }[g.thumb];
  }

  /* ---------- stats ---------- */
  get closingSoonCount(): number {
    return this.items.filter((x) => {
      const d = this.daysLeft(x.deadline);
      return d >= 0 && d <= this.closingDays;
    }).length;
  }

  get nextDeadline(): SavedGrantItem | null {
    const upcoming = this.items
      .filter((x) => this.daysLeft(x.deadline) >= 0)
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
    return upcoming[0] ?? null;
  }

  /* ---------- list ---------- */
  get filtered(): SavedGrantItem[] {
    const kw = this.keyword.trim().toLowerCase();

    const list = this.items.filter((x) => {
      if (this.filter === 'closing') {
        const d = this.daysLeft(x.deadline);
        if (d < 0 || d > this.closingDays) return false;
      }
      if (kw && !`${x.title} ${x.donor} ${x.category}`.toLowerCase().includes(kw)) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (this.sortKey === 'title') return a.title.localeCompare(b.title);
      if (this.sortKey === 'newest') return b.addedOn.localeCompare(a.addedOn);
      return a.deadline.localeCompare(b.deadline);
    });
  }

  /* ---------- actions ---------- */
  setFilter(f: FilterKey): void {
    this.filter = f;
  }

  toggleFavorite(g: SavedGrantItem): void {
    g.favorite = !g.favorite; // Baad me Api: favorite toggle
  }

  remove(g: SavedGrantItem): void {
    this.items = this.items.filter((x) => x.id !== g.id); // Baad me Api: remove saved grant
  }

  archive(g: SavedGrantItem): void {
    this.items = this.items.filter((x) => x.id !== g.id); // Baad me Api: archive grant
  }

  viewGrant(g: SavedGrantItem): void {
    this.router.navigate(['/grant', g.id]);
  }

  browse(): void {
    this.router.navigateByUrl('/latest');
  }
}
