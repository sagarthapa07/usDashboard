import { Component, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { BrandInfo, HelpButtonInfo, MenuEntry, Panel } from '../../../datatype';
import {
  MENU_ROUTES,
  MOCK_BRAND,
  MOCK_HELP_BUTTON,
  MOCK_MAIN_MENU,
  MOCK_PANELS,
  ROUTE_PARENTS,
} from '../../core/mock-data';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [],
  templateUrl: './leftbar.html',
  styleUrl: './leftbar.scss',
})
export class Leftbar {
  /* ----- Parent (header component) se aayenge ----- */
  @Input() isCollapsed = false; // desktop: sidebar band hai ya nahi
  @Input() isOpen = false; // mobile: drawer khula hai ya nahi

  /* =====================================================
     DATA: mock-data.ts se (baad me API se aayega)
     ===================================================== */
  brand: BrandInfo = MOCK_BRAND;
  helpButton: HelpButtonInfo = MOCK_HELP_BUTTON;
  mainMenu: MenuEntry[] = MOCK_MAIN_MENU;
  panels: Panel[] = MOCK_PANELS;

  /* =====================================================
     SIDEBAR KI STATE
     ===================================================== */
  activeKey = 'dash'; // abhi kaunsa tab active hai (blue)
  panelStack: string[] = ['root']; // panels ka history (back button ke liye)
  openGroup = ''; // kaunsa accordion khula hai

  constructor(private router: Router) {
    // Page khulte hi (refresh ke baad bhi) URL se sahi link highlight karo
    this.syncFromUrl(this.router.url);

    // Page badalne par bhi
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.syncFromUrl((e as NavigationEnd).urlAfterRedirects));
  }

  /* Abhi dikhne wala panel */
  get currentPanel(): string {
    return this.panelStack[this.panelStack.length - 1];
  }

  /* Pichla panel (jo left me khisak jaata hai) */
  isPrev(name: string): boolean {
    return name !== this.currentPanel && this.panelStack.includes(name);
  }

  /* Naye panel me jao (Grants, Resources, Alerts, Profile) */
  goTo(name: string): void {
    this.panelStack.push(name);
    this.openGroup = '';
  }

  /* Back button: Menu par wapas */
  goBack(): void {
    if (this.panelStack.length > 1) {
      this.panelStack.pop();
      this.openGroup = '';
    }
  }

  /* Accordion open / close */
  toggleGroup(name: string): void {
    this.openGroup = this.openGroup === name ? '' : name;
  }

  /* Link par click: active set karo, aur page ho to wahan jao */
  onLink(event: Event, key: string): void {
    event.preventDefault();
    this.go(key);
  }

  /* Brand (logo) par click */
  setActive(key: string): void {
    this.go(key);
  }

  private go(key: string): void {
    this.activeKey = key;

    const path = MENU_ROUTES[key];
    if (path) {
      this.router.navigateByUrl(path);
    }
  }

  /* Detail page (/article/3) ko uske parent list page (/articles) me badlo */
  private resolvePath(path: string): string {
    for (const [child, parent] of Object.entries(ROUTE_PARENTS)) {
      if (path === child || path.startsWith(child + '/')) return parent;
    }
    return path;
  }

  private syncFromUrl(url: string): void {
    const rawPath = url.split('?')[0].split('#')[0];
    const path = this.resolvePath(rawPath);

    // Is path ki saari keys (duplicate ho to bhi chalega)
    const keys = Object.keys(MENU_ROUTES).filter((k) => MENU_ROUTES[k] === path);

    for (const key of keys) {
      // 1) Kisi panel ke accordion group ya normal link me hai?
      for (const p of this.panels) {
        const group = p.groups.find((g) => g.links.some((l) => l.key === key));
        if (group) {
          this.activeKey = key;
          this.panelStack = ['root', p.id];
          this.openGroup = group.id;
          return;
        }
        if (p.links.some((l) => l.key === key)) {
          this.activeKey = key;
          this.panelStack = ['root', p.id];
          // Accordion ko jaisa tha waisa hi rehne do (band mat karo)
          return;
        }
      }

      // 2) Main menu ka link hai (Dashboard, My Grants...)?
      if (this.mainMenu.some((m) => m.type === 'link' && m.key === key)) {
        this.activeKey = key;
        this.panelStack = ['root'];
        this.openGroup = '';
        return;
      }
    }
    // Koi key nahi mili to menu jaisa hai waisa hi rehne do
  }
}