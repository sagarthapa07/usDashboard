import { Component, HostListener } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GrantDetail, RelatedGrant } from '../../../datatype';
import { getGrantDetail, hasGrantDetail } from '../../core/mock-data';

type RailKey = 'state' | 'thematic';

@Component({
  selector: 'app-grant-details',
  imports: [DatePipe],
  templateUrl: './grant-details.html',
  styleUrl: './grant-details.scss',
})
export class GrantDetails {
  /* =====================================================
     DATA
     ===================================================== */
  detail: GrantDetail | null = null;

  // Hero ke andar rang-birangi bars (image na ho tab)
  bars = [
    { h: 105, c: '#ef4a5a' },
    { h: 150, c: '#f0872e' },
    { h: 175, c: '#f2c94c' },
    { h: 135, c: '#22a99a' },
    { h: 100, c: '#5b5bd6' },
  ];

  /* =====================================================
     CAROUSEL STATE
     ===================================================== */
  perPage = 4; // ek baar me kitne cards (screen ke hisaab se)
  page: Record<RailKey, number> = { state: 0, thematic: 0 };

  /* =====================================================
     ACTIONS STATE
     ===================================================== */
  copied = false;
  saved = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.updatePerPage();

    // URL ka id badalte hi (related grant par click) data bhi badlo
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((p) => {
      this.detail = getGrantDetail(p.get('id') ?? '');
      this.page = { state: 0, thematic: 0 };
      this.copied = false;
      this.saved = false;

      if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
    });
  }

  /* =====================================================
     CAROUSEL helpers
     ===================================================== */
  @HostListener('window:resize')
  updatePerPage(): void {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1400;
    this.perPage = w > 1280 ? 4 : w > 900 ? 3 : w > 600 ? 2 : 1;

    // Screen chhoti/badi hone par page out-of-range na ho
    (['state', 'thematic'] as RailKey[]).forEach((k) => {
      this.page[k] = Math.min(this.page[k], this.pageCount(k) - 1);
    });
  }

  private items(key: RailKey): RelatedGrant[] {
    if (!this.detail) return [];
    return key === 'state' ? this.detail.relatedState : this.detail.relatedThematic;
  }

  visible(key: RailKey): RelatedGrant[] {
    const start = this.page[key] * this.perPage;
    return this.items(key).slice(start, start + this.perPage);
  }

  pageCount(key: RailKey): number {
    return Math.max(1, Math.ceil(this.items(key).length / this.perPage));
  }

  dots(key: RailKey): number[] {
    return Array.from({ length: this.pageCount(key) }, (_, i) => i);
  }

  prev(key: RailKey): void {
    const n = this.pageCount(key);
    this.page[key] = (this.page[key] - 1 + n) % n;
  }

  next(key: RailKey): void {
    const n = this.pageCount(key);
    this.page[key] = (this.page[key] + 1) % n;
  }

  goTo(key: RailKey, i: number): void {
    this.page[key] = i;
  }

  // Related card par click: agar uski detail hai to wahan jao
  openRelated(r: RelatedGrant): void {
    const id = String(r.id);
    if (hasGrantDetail(id)) {
      this.router.navigate(['/grant', id]);
    } else {
      console.log('Related grant (API aane par khulega):', r); // TODO: API
    }
  }

  /* =====================================================
     ACTIONS
     ===================================================== */
  visitWebsite(): void {
    const url = this.detail?.websiteUrl;
    if (!url) {
      console.log('Official website link nahi hai'); // TODO: API se aayega
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  copyUrl(): void {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;

    navigator.clipboard.writeText(window.location.href).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  setAlert(): void {
    console.log('Set grant alert:', this.detail?.id); // TODO: alert API
  }

  toggleSave(): void {
    this.saved = !this.saved; // TODO: save API
  }

  goBack(): void {
    this.router.navigateByUrl('/latest');
  }
}