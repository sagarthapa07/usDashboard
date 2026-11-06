import { Component } from '@angular/core';
import { Topbar } from '../../layout/topbar/topbar';
import { Leftbar } from '../../layout/leftbar/leftbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-header',
  imports: [Topbar, Leftbar, Footer],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  isSidebarCollapsed = false;
  isMobileMenuOpen = false;

  /* Burger button click */
  toggleSidebar(): void {
     console.log('3: Header ko burger ka event mila');
    if (typeof window !== 'undefined' && window.innerWidth > 1000) {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    } else {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }
  }
}
