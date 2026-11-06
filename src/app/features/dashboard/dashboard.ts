import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdvancedFilterValue,
  DropdownItem,
  GrantCardData,
  ResourceData,
  ResourceType,
  SearchBarValue,
} from '../../../datatype';
import {
  MOCK_AREAS,
  MOCK_DONORS,
  MOCK_GRANTS,
  MOCK_RESOURCES,
  MOCK_STATES,
  RESOURCE_TYPES,
} from '../../core/mock-data';
import { Header } from '../../shared/header/header';
import { Card } from '../../shared/card/card';
import { Table } from '../../layout/table/table';
import { Pagination } from '../../shared/pagination/pagination';
import { ResourceList } from '../../layout/resource-list/resource-list';
import { AdvancedFilter } from '../../shared/advanced-filter/advanced-filter';
import { SearchHero } from '../../shared/search-hero/search-hero';
import { Buttons } from '../../shared/buttons/buttons';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, Header, Card, Table, Pagination, ResourceList, AdvancedFilter, SearchHero, Buttons],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  // Time ke hisab se greeting
  greeting = this.getGreeting();

  // Kaunsa design dikhana hai: tile cards / detailed cards / table
  viewMode: 'tile' | 'detailed' | 'table' = 'tile';

  // Pagination (grants ke liye)
  currentPage = 1;
  pageSize = 8;

  /* =====================================================
     DATA: seedha mock-data.ts se (API baad me lagayenge)
     structuredClone isliye, ki card me isFav toggle karne par
     original mock data na badle
     ===================================================== */
  states: DropdownItem[] = MOCK_STATES;
  areas: DropdownItem[] = MOCK_AREAS;
  donors: DropdownItem[] = MOCK_DONORS;
  cards: GrantCardData[] = structuredClone(MOCK_GRANTS);

  // Left side filter ki abhi ki values
  filter: AdvancedFilterValue = {
    dateBy: 'post',
    from: '',
    to: '',
    states: [],
    areas: [],
    grantSizes: [],
    donors: [],
  };

  // Upar wale search bar ki abhi ki values
  searchBar: SearchBarValue = {
    keyword: '',
    type: 'all',
    closingSoon: false,
    includeExpired: false,
  };

  /* =====================================================
     GRANTS: search bar + left filter + pagination
     ===================================================== */
  // Dono filters lagne ke baad bache hue cards
  get filteredCards(): GrantCardData[] {
    const f = this.filter;
    const s = this.searchBar;

    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const kw = s.keyword.toLowerCase();

    return this.cards.filter((c) => {
      // ----- Upar wala search bar -----
      if (kw) {
        const text = `${c.title} ${c.donor} ${c.category} ${c.state}`.toLowerCase();
        if (!text.includes(kw)) return false;
      }
      if (s.type !== 'all' && c.type !== s.type) return false;

      if (s.closingSoon) {
        if (c.deadline < today || c.deadline > in30) return false;
      } else if (!s.includeExpired && c.deadline < today) {
        return false; // nikal chuke grants chhupao
      }

      // ----- Left side filter -----
      if (f.states.length && !f.states.includes(c.state)) return false;
      if (f.areas.length && !f.areas.includes(c.category)) return false;
      if (f.donors.length && !f.donors.includes(c.donor)) return false;

      // Date filter: Post Date ya Last Date
      const d = f.dateBy === 'deadline' ? c.deadline : c.posted;
      if (f.from && (!d || d < f.from)) return false;
      if (f.to && (!d || d > f.to)) return false;

      return true;
    });
  }

  // Sirf current page ke cards
  get pagedCards(): GrantCardData[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCards.slice(start, start + this.pageSize);
  }

  onSearchBar(v: SearchBarValue): void {
    this.searchBar = v;
    this.currentPage = 1;
  }

  onFilter(f: AdvancedFilterValue): void {
    this.filter = f;
    this.currentPage = 1; // filter badalne par page 1 par wapas
  }

  setView(mode: 'tile' | 'detailed' | 'table'): void {
    this.viewMode = mode;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1; // size badalne par page 1 par wapas
  }

  onFavToggle(g: GrantCardData): void {
    console.log('Fav:', g);
  }

  onView(g: GrantCardData): void {
    console.log('View:', g);
  }

  /* =====================================================
     RESOURCES (sirf dashboard me dikhenge)
     ===================================================== */
  resourceTypes = RESOURCE_TYPES;
  activeResource: ResourceType = 'proposal';

  // Grants ka toggle hi resources par bhi lagta hai: table => table, baaki => cards
  get resourceView(): 'cards' | 'table' {
    return this.viewMode === 'table' ? 'table' : 'cards';
  }

  // Jo tab khula hai uska data
  get resourceItems(): ResourceData[] {
    return MOCK_RESOURCES[this.activeResource];
  }

  setResource(t: ResourceType): void {
    this.activeResource = t;
  }

  onResourceOpen(r: ResourceData): void {
    console.log('Open resource:', r);
  }

  onResourceDownload(r: ResourceData): void {
    console.log('Download resource:', r);
  }

  onResourceFav(r: ResourceData): void {
    console.log('Fav resource:', r);
  }

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
}