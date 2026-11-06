import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { TopbarMenuLink, TopbarUser } from '../../../datatype';
import {
  MOCK_NOTIFICATION_COUNT,
  MOCK_PAGE_CRUMBS,
  MOCK_PAGE_NAME,
  MOCK_USER,
  MOCK_USER_MENU_LINKS,
  TOPBAR_HOME_PATH,
  getGrantDetail,
} from '../../core/mock-data';

@Component({
  selector: 'app-topbar',
  imports: [NgIf, NgFor],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar implements OnInit {
  @Input() isSidebarClosed = false;
  @Input() pageName = MOCK_PAGE_NAME;
  @Input() notificationCount = MOCK_NOTIFICATION_COUNT;
  @Output() menuToggle = new EventEmitter<void>();
  @Output() signOut = new EventEmitter<void>(); // parent me logout handle karna ho to

  /* =====================================================
     DATA: mock-data.ts se (baad me API se aayega)
     ===================================================== */
  user: TopbarUser = MOCK_USER;
  menuLinks: TopbarMenuLink[] = MOCK_USER_MENU_LINKS;

  // Breadcrumb ke tukde (Home ke baad wale)
  crumbs: string[] = [MOCK_PAGE_NAME];

  // Abhi kaun sa page khula hai (dropdown me active link dikhane ke liye)
  currentPath = '';

  isUserMenuOpen = false;

  constructor(
    private elementRef: ElementRef,
    private router: Router,
  ) {
    // Page badalne par breadcrumb + active link badlo
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.setCrumbs((e as NavigationEnd).urlAfterRedirects));
  }

  // Page khulte hi URL se breadcrumb set karo
  ngOnInit(): void {
    this.setCrumbs(this.router.url);
  }

  private cleanPath(url: string): string {
    return url.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  }

  private setCrumbs(url: string): void {
    const path = this.cleanPath(url);
    this.currentPath = path;

    let crumbs = MOCK_PAGE_CRUMBS[path];
    if (!crumbs && path.startsWith('/grant/')) {
      const id = decodeURIComponent(path.split('/')[2] ?? '');
      const d = getGrantDetail(id);
      crumbs = ['Find Grants', d?.shortTitle ?? 'Grant Details'];
    }

    if (!crumbs) {
      const last = path.split('/').filter(Boolean).pop();
      if (!last) return;
      crumbs = [last.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())];
    }

    this.crumbs = crumbs;
    this.pageName = crumbs[crumbs.length - 1];
  }

  /* ---------- Navigation ---------- */
  goTo(event: Event, path: string): void {
    event.preventDefault();
    this.isUserMenuOpen = false;
    this.router.navigateByUrl(path);
  }

  isActive(path: string): boolean {
    return this.currentPath === path;
  }

  get homePath(): string {
    return TOPBAR_HOME_PATH;
  }

  onBurgerClick(): void {
    this.menuToggle.emit();
  }

  /* User dropdown open/close */
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  /* Sign out click */
  onSignOut(event: Event): void {
    event.preventDefault();
    this.isUserMenuOpen = false;
    this.signOut.emit(); // TODO: logout logic (token hatao, /login par bhejo)
  }

  /* Menu ke bahar click karne par dropdown band */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen = false;
    }
  }

  /* Esc key dabane par dropdown band */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isUserMenuOpen = false;
  }
}