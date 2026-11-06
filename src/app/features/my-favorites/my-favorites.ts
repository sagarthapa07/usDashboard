import { DatePipe, NgClass } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { FavCollection, FavItem, FavKind } from '../../../datatype';
import { FAV_COLLECTIONS, MOCK_FAVORITES } from '../../core/mock-data';

type DrawerKind = FavKind | 'all';
type DrawerSort = 'recent' | 'title' | 'deadline';

@Component({
  selector: 'app-my-favorites',
  imports: [FormsModule, NgClass, DatePipe],
  templateUrl: './my-favorites.html',
  styleUrl: './my-favorites.scss',
})
export class MyFavorites {
  collections = FAV_COLLECTIONS;

  // Baad me Api se aayega: this.api.getFavorites()
  items: FavItem[] = MOCK_FAVORITES.map((x) => ({ ...x }));

  sortOptions: { key: DrawerSort; label: string }[] = [
    { key: 'recent', label: 'Recently added' },
    { key: 'title', label: 'Title: A to Z' },
    { key: 'deadline', label: 'Deadline: soonest' },
  ];

  keyword = ''; // upar ka "Search all your favorites"
  openKind: DrawerKind | null = null; // drawer band hai to null
  drawerKeyword = '';
  drawerSort: DrawerSort = 'recent';

  constructor(private router: Router) {}

  /* ---------- helpers ---------- */
  daysLeft(deadline: string): number {
    const today = new Date().toISOString().slice(0, 10);
    const ms =
      new Date(deadline + 'T00:00:00Z').getTime() - new Date(today + 'T00:00:00Z').getTime();
    return Math.round(ms / 86_400_000);
  }

  daysText(deadline: string): string {
    const d = this.daysLeft(deadline);
    if (d === 0) return 'Today';
    return `${d} day${d > 1 ? 's' : ''}`;
  }

  chipClass(deadline: string): string {
    const d = this.daysLeft(deadline);
    if (d <= 7) return 'hot';
    if (d <= 14) return 'warn';
    return 'ok';
  }

  count(kind: FavKind): number {
    return this.items.filter((x) => x.kind === kind).length;
  }

  // Card ke andar ke bullet titles (sabse naye pehle)
  preview(c: FavCollection): FavItem[] {
    return this.items
      .filter((x) => x.kind === c.kind)
      .sort((a, b) => b.addedOn.localeCompare(a.addedOn))
      .slice(0, c.preview);
  }

  singleLabel(it: FavItem): string {
    return this.collections.find((c) => c.kind === it.kind)?.single ?? '';
  }

  /* ---------- Closing soon card ---------- */
  get closing(): FavItem[] {
    return this.items
      .filter((x) => x.kind === 'funding' && x.deadline && this.daysLeft(x.deadline) >= 0)
      .sort((a, b) => a.deadline!.localeCompare(b.deadline!))
      .slice(0, 4);
  }

  /* ---------- drawer ---------- */
  get drawerTitle(): string {
    if (this.openKind === 'all') return 'Search results';
    return this.collections.find((c) => c.kind === this.openKind)?.label ?? '';
  }

  get drawerIcon(): string {
    if (this.openKind === 'all') return 'bi-search';
    return this.collections.find((c) => c.kind === this.openKind)?.icon ?? 'bi-heart';
  }

  get drawerTotal(): number {
    return this.openKind === 'all' ? this.items.length : this.count(this.openKind as FavKind);
  }

  get drawerItems(): FavItem[] {
    const kw = this.drawerKeyword.trim().toLowerCase();

    const list = this.items.filter((x) => {
      if (this.openKind !== 'all' && x.kind !== this.openKind) return false;
      if (kw && !`${x.title} ${x.meta}`.toLowerCase().includes(kw)) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (this.drawerSort === 'title') return a.title.localeCompare(b.title);
      if (this.drawerSort === 'deadline') {
        return (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31');
      }
      return b.addedOn.localeCompare(a.addedOn);
    });
  }

  open(kind: FavKind): void {
    this.openKind = kind;
    this.drawerKeyword = '';
    this.drawerSort = 'recent';
  }

  // Upar ke search me Enter dabane par saare favorites me dhundhta hai
  openSearch(): void {
    if (!this.keyword.trim()) return;
    this.openKind = 'all';
    this.drawerKeyword = this.keyword.trim();
    this.drawerSort = 'recent';
  }

  close(): void {
    this.openKind = null;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close();
  }

  /* ---------- actions ---------- */
  unfavorite(it: FavItem): void {
    this.items = this.items.filter((x) => x.id !== it.id); // Baad me Api: remove favorite
  }

  archive(it: FavItem): void {
    this.items = this.items.filter((x) => x.id !== it.id); // Baad me Api: archive item
  }

  openItem(it: FavItem): void {
    // Abhi sirf grants ka details page hai
    if (it.kind === 'funding') this.router.navigate(['/grant', it.id]);
  }

  browse(): void {
    this.router.navigateByUrl('/latest');
  }
}