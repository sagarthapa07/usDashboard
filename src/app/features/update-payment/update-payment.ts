import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaymentCard } from '../../../datatype';
import {
  MOCK_PAYMENT_CARD,
  MOCK_PAYMENT_NEW_CARD,
  MOCK_PAYMENT_PLAN,
  MOCK_PROFILE,
  PAYMENT_DEMO_DELAY,
  PAYMENT_PAGE_TEXT,
  PAYMENT_STRIPE_URL,
} from '../../core/mock-data';

@Component({
  selector: 'app-update-payment',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './update-payment.html',
  styleUrl: './update-payment.scss',
})
export class UpdatePayment implements OnDestroy {
  // ----- page ka data (mock-data.ts se, baad me Api se) -----
  text = PAYMENT_PAGE_TEXT;
  plan = MOCK_PAYMENT_PLAN;
  card: PaymentCard = { ...MOCK_PAYMENT_CARD };

  // Card holder aur receipts email profile se aate hain (baad me profile Api / shared service se)
  holder = MOCK_PROFILE.name;
  email = MOCK_PROFILE.email; 

  // ----- UI state -----
  dialogOpen = false;
  loading = false;
  flipping = false;
  toastOn = false;

  private trigger: HTMLElement | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private host: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    // Baad me: this.api.getPaymentCard().subscribe(c => (this.card = c));
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  /* ---------- card preview ---------- */
  get maskedNumber(): string {
    return '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ' + this.card.last4;
  }

  get cardLabel(): string {
    return `${this.card.brand} card ending ${this.card.last4}, expires ${this.card.exp}`;
  }

  /* ---------- dialog ---------- */
  openDialog(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.trigger = document.activeElement as HTMLElement | null;
    this.dialogOpen = true;
    this.later(() => this.host.nativeElement.querySelector<HTMLElement>('.py-go')?.focus(), 0);
  }

  closeDialog(): void {
    if (this.loading) return;
    this.dialogOpen = false;
    this.trigger?.focus?.();
  }

  onBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) this.closeDialog();
  }

  /* ---------- Stripe ---------- */
  go(): void {
    this.loading = true;

    // Production: backend se session URL aata hai (ya yahan API call karke URL lo)
    if (PAYMENT_STRIPE_URL) {
      window.location.href = PAYMENT_STRIPE_URL;
      return;
    }

    // DEMO: jaise user Stripe se naya card daal kar wapas aaya ho
    this.later(() => {
      this.loading = false;
      this.dialogOpen = false;
      this.trigger?.focus?.();

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        this.applyNewCard();
        return;
      }
      this.flipping = true;
      this.later(() => {
        this.applyNewCard();
        this.flipping = false;
      }, 350);
    }, PAYMENT_DEMO_DELAY);
  }

  private applyNewCard(): void {
    this.card = { ...MOCK_PAYMENT_NEW_CARD, updatedOn: new Date().toISOString().slice(0, 10) };
    this.showToast();
  }

  /* ---------- toast ---------- */
  private showToast(): void {
    this.toastOn = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastOn = false), 2600);
  }

  private later(fn: () => void, ms: number): void {
    this.timers.push(setTimeout(fn, ms));
  }

  /* ---------- ESC + focus trap ---------- */
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.dialogOpen) return;

    if (e.key === 'Escape' && !this.loading) {
      this.closeDialog();
      return;
    }

    if (e.key === 'Tab') {
      const f = Array.from(
        this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.py-dg button:not(:disabled)'),
      );
      if (!f.length) {
        e.preventDefault();
        return;
      }
      const i = f.indexOf(document.activeElement as HTMLButtonElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) {
        e.preventDefault();
        f[0].focus();
      }
    }
  }
}