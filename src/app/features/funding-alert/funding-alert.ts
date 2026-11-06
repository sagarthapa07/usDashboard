import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit,inject } from '@angular/core';
import {
  FundingAlertFrequency,
  FundingAlertPageText,
  FundingAlertPickerConfig,
  FundingAlertSettings
} from '../../../datatype';
import {
  FA_AREAS,
  FA_MAX,
  FA_PAGE_TEXT,
  FA_PICKERS,
  FA_STATES,
  MOCK_FA_SETTINGS,
} from '../../core/mock-data';

interface PickerState {
  cfg: FundingAlertPickerConfig;
  all: string[];
  saved: string[];
  draft: string[];
  query: string;
}
import { Injectable } from '@angular/core';


@Component({
  selector: 'app-funding-alert',
  imports: [CommonModule],
  templateUrl: './funding-alert.html',
  styleUrl: './funding-alert.scss',
})
export class FundingAlert implements OnInit, OnDestroy {
  readonly text: FundingAlertPageText = FA_PAGE_TEXT;
  readonly max = FA_MAX;
  sections: PickerState[] = [];
  frequency: FundingAlertFrequency = 'Daily';
  savedFrequency: FundingAlertFrequency = 'Daily';
  tipOpen = false;
  toastMsg = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    // Baad me: this.api.getFundingAlerts().subscribe(...)
    const s = MOCK_FA_SETTINGS;
    const lists: Record<string, { all: string[]; saved: string[] }> = {
      states: { all: FA_STATES, saved: s.states },
      areas: { all: FA_AREAS, saved: s.areas },
    };

    this.sections = FA_PICKERS.map((cfg) => ({
      cfg,
      all: lists[cfg.key].all,
      // saved data me bhi kabhi 10 se zyada aaye to bhi 10 par rok do
      saved: lists[cfg.key].saved.slice(0, FA_MAX),
      draft: lists[cfg.key].saved.slice(0, FA_MAX),
      query: '',
    }));

    this.frequency = s.frequency;
    this.savedFrequency = s.frequency;
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  /* ---------- Getters ---------- */
  get statesCount(): number {
    return this.section('states')?.draft.length ?? 0;
  }

  get areasCount(): number {
    return this.section('areas')?.draft.length ?? 0;
  }

  get dirty(): boolean {
    if (this.frequency !== this.savedFrequency) return true;
    return this.sections.some(
      (s) => [...s.draft].sort().join('|') !== [...s.saved].sort().join('|'),
    );
  }

  /* ---------- Picker helpers ---------- */
  private section(key: string): PickerState | undefined {
    return this.sections.find((s) => s.cfg.key === key);
  }

  trackByKey = (_: number, s: PickerState) => s.cfg.key;

  visible(s: PickerState): string[] {
    const q = s.query.trim().toLowerCase();
    return s.all.filter((x) => x.toLowerCase().includes(q));
  }

  onSearch(s: PickerState, e: Event): void {
    s.query = (e.target as HTMLInputElement).value;
  }

  isSelected(s: PickerState, v: string): boolean {
    return s.draft.includes(v);
  }

  isFull(s: PickerState): boolean {
    return s.draft.length >= this.max;
  }

  isNew(s: PickerState, v: string): boolean {
    return !s.saved.includes(v);
  }

  /* ---------- Single checkbox / chip remove ---------- */
  toggle(s: PickerState, v: string, e?: Event): void {
    const i = s.draft.indexOf(v);

    if (i >= 0) {
      s.draft.splice(i, 1);
      return;
    }

    if (this.isFull(s)) {
      if (e) (e.target as HTMLInputElement).checked = false; // checkbox wapas uncheck
      this.toast(`You can select only ${this.max} ${s.cfg.noun}. Remove one to add another.`);
      return;
    }

    s.draft.push(v);
  }

  /* ---------- Select All ---------- */
  private selectedInList(s: PickerState, list: string[]): number {
    return list.filter((v) => s.draft.includes(v)).length;
  }

  allChecked(s: PickerState, list: string[]): boolean {
    if (!list.length) return false;
    return this.selectedInList(s, list) >= Math.min(list.length, this.max);
  }

  someChecked(s: PickerState, list: string[]): boolean {
    return this.selectedInList(s, list) > 0 && !this.allChecked(s, list);
  }

  toggleAll(s: PickerState, list: string[], e: Event): void {
    // Sab selected hai to is list ke items hata do
    if (this.allChecked(s, list)) {
      s.draft = s.draft.filter((v) => !list.includes(v));
      return;
    }

    let skipped = false;
    for (const v of list) {
      if (s.draft.includes(v)) continue;
      if (this.isFull(s)) {
        skipped = true;
        break;
      }
      s.draft.push(v);
    }

    if (skipped) {
      this.toast(`Only ${this.max} ${s.cfg.noun} can be selected, so the first ${this.max} were picked.`);
    }
    (e.target as HTMLInputElement).checked = this.allChecked(s, list);
  }

  clearAll(s: PickerState): void {
    s.draft = [];
  }

  /* ---------- Save / Discard ---------- */
  save(): void {
    // Baad me: this.api.saveFundingAlerts({ states, areas, frequency }).subscribe(...)
    this.sections.forEach((s) => (s.saved = [...s.draft]));
    this.savedFrequency = this.frequency;
    this.toast(this.text.savedToast);
  }

  discard(): void {
    this.sections.forEach((s) => (s.draft = [...s.saved]));
    this.frequency = this.savedFrequency;
  }

  /* ---------- Tooltip ---------- */
  toggleTip(e: Event): void {
    e.stopPropagation();
    this.tipOpen = !this.tipOpen;
  }

  @HostListener('document:click')
  closeTip(): void {
    this.tipOpen = false;
  }

  /* ---------- Tutorial ---------- */
  openTutorial(): void {
    if (this.text.tutorialUrl) window.open(this.text.tutorialUrl, '_blank');
  }

  /* ---------- Toast ---------- */
  private toast(msg: string): void {
    this.toastMsg = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMsg = ''), 2600);
  }
}