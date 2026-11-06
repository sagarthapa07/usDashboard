import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PasswordChangeError,
  PasswordChangePayload,
  PasswordFieldKey,
  PasswordInfo,
} from '../../../datatype';
import {
  MOCK_PASSWORD_INFO,
  PASSWORD_DEMO_DELAY,
  PASSWORD_FIELDS,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PAGE_TEXT,
  PASSWORD_RESET_COOLDOWN,
  PASSWORD_RULES,
  PASSWORD_STRENGTH_LABELS,
  PASSWORD_STRONG_LENGTH,
  PASSWORD_TOAST_MS,
} from '../../core/mock-data'; // <- apne folder ke hisaab se path badal lena

type ServerErr = { msg: string; val: string } | null;


@Component({
  selector: 'app-change-password',
  imports: [CommonModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword implements OnInit, OnDestroy{
  readonly text = PASSWORD_PAGE_TEXT;
  readonly fields = PASSWORD_FIELDS;
  readonly rules = PASSWORD_RULES;
  readonly strengthLabels = PASSWORD_STRENGTH_LABELS;

  info: PasswordInfo = { lastChanged: '', email: '' };

  values: Record<PasswordFieldKey, string> = { current: '', next: '', confirm: '' };
  show: Record<PasswordFieldKey, boolean> = { current: false, next: false, confirm: false };
  serverErr: Record<'current' | 'next', ServerErr> = { current: null, next: null };

  capsOn = false;
  signOutOthers = true;
  saving = false;

  toastText = '';
  toastOn = false;
  private toastTimer: any;

  // Forgot password dialog
  fpOpen = false;
  fpSent = false;
  fpBusy = false;
  fpLeft = 0;
  fpError = '';
  private fpTimer: any;
  private fpTrigger: HTMLElement | null = null;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    // Baad me Api se aayega: this.api.getPasswordInfo()
    this.info = { ...MOCK_PASSWORD_INFO };
  }

  ngOnDestroy(): void {
    clearTimeout(this.toastTimer);
    clearInterval(this.fpTimer);
  }

  /* ---------- validation / strength ---------- */
  private check(key: string): boolean {
    const c = this.values.current;
    const n = this.values.next;
    switch (key) {
      case 'len':
        return n.length >= PASSWORD_MIN_LENGTH;
      case 'case':
        return /[a-z]/.test(n) && /[A-Z]/.test(n);
      case 'num':
        return /\d/.test(n);
      case 'sym':
        return /[^A-Za-z0-9\s]/.test(n);
      case 'diff':
        return !!n && n !== c;
      default:
        return false;
    }
  }

  get passes(): boolean[] {
    return this.rules.map((r) => this.check(r.key));
  }

  get level(): number {
    const n = this.values.next;
    if (!n) return 0;
    const base =
      this.rules.filter((r) => r.key !== 'diff' && this.check(r.key)).length +
      (n.length >= PASSWORD_STRONG_LENGTH ? 1 : 0);
    return base <= 2 ? 1 : base === 3 ? 2 : base === 4 ? 3 : 4;
  }

  get confirmMsg(): { text: string; good: boolean } {
    const { next, confirm } = this.values;
    if (confirm && confirm !== next) return { text: this.text.mismatch, good: false };
    if (confirm && confirm === next) return { text: this.text.match, good: true };
    return { text: '', good: false };
  }

  // Field ke neeche ka message (server error ya confirm message)
  msgFor(key: PasswordFieldKey): { text: string; good: boolean } {
    if (key === 'confirm') return this.confirmMsg;
    const e = this.serverErr[key];
    return e && e.val === this.values[key] ? { text: e.msg, good: false } : { text: '', good: false };
  }

  get canSave(): boolean {
    return !!this.values.current && this.passes.every(Boolean) && this.values.next === this.values.confirm;
  }

  /* ---------- events ---------- */
  onInput(key: PasswordFieldKey, value: string): void {
    this.values[key] = value;
  }

  onCaps(e: KeyboardEvent): void {
    this.capsOn = !!(e.getModifierState && e.getModifierState('CapsLock'));
  }

  toggleShow(key: PasswordFieldKey): void {
    this.show[key] = !this.show[key];
    this.focusField(key);
  }

  eyeLabel(key: PasswordFieldKey, label: string): string {
    return (this.show[key] ? 'Hide ' : 'Show ') + label.toLowerCase();
  }

  private focusField(key: PasswordFieldKey): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLInputElement>('#pw-' + key)?.focus());
  }

  /* ---------- submit ---------- */
  submit(e: Event): void {
    e.preventDefault();
    if (!this.canSave || this.saving) return;
    this.saving = true;

    const payload: PasswordChangePayload = {
      currentPassword: this.values.current,
      newPassword: this.values.next,
      signOutOthers: this.signOutOthers,
    };
    const out = this.signOutOthers;

    this.changePassword(payload)
      .then(() => {
        this.info.lastChanged = new Date().toISOString().slice(0, 10);
        this.clearAll();
        this.showToast(out ? this.text.toastDoneOthers : this.text.toastDone);
      })
      .catch((err: PasswordChangeError) => {
        const f: 'current' | 'next' = err?.field === 'next' ? 'next' : 'current';
        this.serverErr[f] = { msg: err?.msg || this.text.genericError, val: this.values[f] };
        this.focusField(f);
      })
      .finally(() => (this.saving = false));
  }

  // Production: apni API call yahan lagao.
  // Galat current password par reject karo: Promise.reject({ field: 'current', msg: '...' })
  private changePassword(_payload: PasswordChangePayload): Promise<void> {
    return new Promise((res) => setTimeout(res, PASSWORD_DEMO_DELAY)); // DEMO: hamesha success
  }

  private clearAll(): void {
    this.values = { current: '', next: '', confirm: '' };
    this.show = { current: false, next: false, confirm: false };
    this.serverErr = { current: null, next: null };
    this.capsOn = false;
    this.signOutOthers = true;
  }

  private showToast(t: string): void {
    this.toastText = t;
    this.toastOn = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastOn = false), PASSWORD_TOAST_MS);
  }

  /* ---------- last changed / email ---------- */
  get lastChangedText(): string {
    if (!this.info.lastChanged) return this.text.neverChanged;
    return new Date(this.info.lastChanged).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  get maskedEmail(): string {
    const [name = '', domain = ''] = (this.info.email || '').split('@');
    return (name[0] || '') + '***@' + domain;
  }

  /* ---------- forgot password dialog ---------- */
  openForgot(): void {
    this.fpTrigger = document.activeElement as HTMLElement;
    clearInterval(this.fpTimer);
    this.fpSent = false;
    this.fpError = '';
    this.fpOpen = true;
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('#pw-fp-send')?.focus());
  }

  closeForgot(): void {
    if (this.fpBusy) return;
    this.fpOpen = false;
    clearInterval(this.fpTimer);
    this.fpTrigger?.focus?.();
  }

  sendLink(): void {
    this.fpBusy = true;
    this.fpError = '';
    this.sendResetLink(this.info.email)
      .then(() => {
        this.fpSent = true;
        this.startCooldown();
        setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('#pw-fp-done')?.focus());
      })
      .catch(() => (this.fpError = this.text.fpError))
      .finally(() => (this.fpBusy = false));
  }

  // Production: backend ko bolo ek-baar wala reset link email kare (~30 min).
  private sendResetLink(_email: string): Promise<void> {
    return new Promise((res) => setTimeout(res, PASSWORD_DEMO_DELAY)); // DEMO: hamesha success
  }

  private startCooldown(): void {
    this.fpLeft = PASSWORD_RESET_COOLDOWN;
    clearInterval(this.fpTimer);
    this.fpTimer = setInterval(() => {
      this.fpLeft--;
      if (this.fpLeft <= 0) clearInterval(this.fpTimer);
    }, 1000);
  }

  get resendLabel(): string {
    if (this.fpBusy) return this.text.fpSending;
    return this.fpLeft > 0 ? `${this.text.fpResendIn} ${this.fpLeft}s` : this.text.fpResend;
  }

  // Esc se band + dialog ke andar Tab lock
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.fpOpen) return;
    if (e.key === 'Escape') {
      this.closeForgot();
      return;
    }
    if (e.key !== 'Tab') return;
    const btns = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.pw-dg button'),
    ).filter((b) => !b.disabled);
    if (!btns.length) {
      e.preventDefault();
      return;
    }
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (e.shiftKey && i <= 0) {
      e.preventDefault();
      btns[btns.length - 1].focus();
    } else if (!e.shiftKey && (i === btns.length - 1 || i < 0)) {
      e.preventDefault();
      btns[0].focus();
    }
  }

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.closeForgot();
  }
  
}
