import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ProfileData, ProfileSectionKey } from '../../../datatype';
import {
  MOCK_PROFILE,
  PROFILE_AREAS,
  PROFILE_BADGES,
  PROFILE_BIO_MAX,
  PROFILE_BUDGETS,
  PROFILE_COUNTRIES,
  PROFILE_MIN_INTERESTS,
  PROFILE_NOTIFICATIONS,
  PROFILE_ORG_TYPES,
  PROFILE_PHOTO_MAX_MB,
  PROFILE_SECTIONS,
  PROFILE_STATES,
} from '../../core/mock-data';

// Har section ke kaun se fields strength me ginne hain
const SECTION_FIELDS: Record<string, string[]> = {
  personal: ['name', 'role', 'email', 'phone', 'bio'],
  org: ['org', 'orgType', 'budget', 'web'],
  address: ['address', 'city', 'zip', 'state', 'country'],
};

const atLeastOne = (c: AbstractControl): ValidationErrors | null =>
  Array.isArray(c.value) && c.value.length ? null : { required: true };

@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './update-profile.html',
  styleUrl: './update-profile.scss',
})
export class UpdateProfile implements AfterViewInit, OnDestroy {
  // ----- page ka data (mock-data.ts se, baad me Api se) -----
  sections = PROFILE_SECTIONS;
  badges = PROFILE_BADGES;
  orgTypes = PROFILE_ORG_TYPES;
  budgets = PROFILE_BUDGETS;
  states = PROFILE_STATES;
  countries = PROFILE_COUNTRIES;
  areas = PROFILE_AREAS;
  notifOptions = PROFILE_NOTIFICATIONS;
  bioMax = PROFILE_BIO_MAX;

  form: FormGroup;

  // ----- UI state -----
  submitted = false;
  isDirty = false;
  strength = 0;
  strengthText = 'Complete every section';
  counts: Record<string, string> = {};
  countsDone: Record<string, boolean> = {};
  activeSection = 'pf-s-personal';
  toastMsg = '';
  toastOn = false;
  toastBad = false;

  private savedJson = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private observer?: IntersectionObserver;
  private beforeUnload = (e: BeforeUnloadEvent) => {
    if (this.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  constructor(
    private fb: FormBuilder,
    private host: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      role: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)]],
      phone: ['', Validators.pattern(/^[+\d][\d\s\-()]{6,}$/)],
      bio: ['', Validators.maxLength(PROFILE_BIO_MAX)],
      org: ['', Validators.required],
      orgType: ['', Validators.required],
      budget: [''],
      web: ['', Validators.pattern(/^https?:\/\/\S+\.\S+/)],
      address: ['', Validators.required],
      city: ['', Validators.required],
      zip: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\- ]{3,10}$/)]],
      state: ['', Validators.required],
      country: ['', Validators.required],
      interests: [[] as string[], atLeastOne],
      notifications: this.fb.nonNullable.group({
        newGrants: [false],
        deadlines: [false],
        webinars: [false],
        product: [false],
      }),
      photo: [''],
    });

    // Baad me: this.api.getProfile().subscribe(p => this.applyProfile(p));
    this.applyProfile(MOCK_PROFILE);

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.refresh());
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    window.addEventListener('beforeunload', this.beforeUnload);

    // scroll karte waqt left menu me section highlight
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) this.activeSection = en.target.id;
        });
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    this.host.nativeElement.querySelectorAll('.pf-sec').forEach((s) => this.observer?.observe(s));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('beforeunload', this.beforeUnload);
    }
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  /* ---------- load / save ---------- */
  private applyProfile(p: ProfileData): void {
    this.form.reset(p);
    this.savedJson = JSON.stringify(this.form.getRawValue());
    this.submitted = false;
    this.refresh();
  }

  save(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.toast('Fix the highlighted fields', true);
      this.scrollToFirstError();
      return;
    }

    const value = this.trimmed(this.form.getRawValue());
    // Baad me: this.api.updateProfile(value).subscribe(...)
    this.form.reset(value);
    this.savedJson = JSON.stringify(this.form.getRawValue());
    this.submitted = false;
    this.refresh();
    this.toast('Profile saved');
  }

  discard(): void {
    this.form.reset(JSON.parse(this.savedJson));
    this.submitted = false;
    this.refresh();
  }

  private trimmed(v: ProfileData): ProfileData {
    const out = { ...v } as unknown as Record<string, unknown>;
    Object.keys(out).forEach((k) => {
      if (typeof out[k] === 'string') out[k] = (out[k] as string).trim();
    });
    return out as unknown as ProfileData;
  }

  /* ---------- template helpers ---------- */
  bad(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted);
  }

  get bioLength(): number {
    return (this.form.get('bio')?.value || '').length;
  }

  get interests(): string[] {
    return this.form.get('interests')?.value || [];
  }

  get photo(): string {
    return this.form.get('photo')?.value || '';
  }

  get initials(): string {
    const n: string = this.form.get('name')?.value || '';
    return (
      n
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0])
        .join('') || '?'
    ).toUpperCase();
  }

  get heroName(): string {
    return this.form.get('name')?.value || 'Your name';
  }

  get heroSub(): string {
    const v = this.form.value;
    return [v.role, v.org].filter(Boolean).join(' at ') || 'Add your role and organization';
  }

  get interestsBad(): boolean {
    const c = this.form.get('interests');
    return !!c && c.invalid && (c.touched || this.submitted);
  }

  isPicked(area: string): boolean {
    return this.interests.includes(area);
  }

  toggleInterest(area: string): void {
    const c = this.form.get('interests')!;
    const cur: string[] = c.value || [];
    c.setValue(cur.includes(area) ? cur.filter((a) => a !== area) : [...cur, area]);
    c.markAsDirty();
    c.markAsTouched();
  }

  countFor(key: ProfileSectionKey): string {
    return this.counts[key] ?? '';
  }

  /* ---------- photo ---------- */
  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > PROFILE_PHOTO_MAX_MB * 1024 * 1024) {
      this.toast(`Choose an image under ${PROFILE_PHOTO_MAX_MB} MB`, true);
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.form.patchValue({ photo: String(reader.result) });
      this.form.get('photo')?.markAsDirty();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  /* ---------- scroll ---------- */
  goTo(ev: Event, id: string): void {
    ev.preventDefault();
    const el = this.host.nativeElement.querySelector('#' + id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  private scrollToFirstError(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      const el = this.host.nativeElement.querySelector('.pf-bad, .pf-int-bad') as HTMLElement | null;
      el?.scrollIntoView({ block: 'center' });
      el?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    });
  }

  /* ---------- strength / dirty ---------- */
  private refresh(): void {
    this.isDirty = JSON.stringify(this.form.getRawValue()) !== this.savedJson;

    let done = 0;
    let total = 0;
    Object.keys(SECTION_FIELDS).forEach((key) => {
      const fields = SECTION_FIELDS[key];
      const ok = fields.filter((f) => {
        const c = this.form.get(f)!;
        return String(c.value).trim() !== '' && c.valid;
      }).length;
      done += ok;
      total += fields.length;
      this.counts[key] = `${ok}/${fields.length}`;
      this.countsDone[key] = ok === fields.length;
    });

    const ni = this.interests.length;
    done += Math.min(ni, PROFILE_MIN_INTERESTS);
    total += PROFILE_MIN_INTERESTS;
    this.counts['interests'] = `${ni} picked`;
    this.countsDone['interests'] = ni > 0;

    this.strength = Math.round((done / total) * 100);
    this.strengthText =
      this.strength === 100
        ? 'All set, nice work'
        : this.strength >= 70
          ? 'Almost there'
          : 'Add a few more details';
  }

  /* ---------- toast ---------- */
  private toast(msg: string, bad = false): void {
    this.toastMsg = msg;
    this.toastBad = bad;
    this.toastOn = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastOn = false), 2400);
  }

  /* ---------- Ctrl+S ---------- */
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (this.isDirty) this.save();
    }
  }
}