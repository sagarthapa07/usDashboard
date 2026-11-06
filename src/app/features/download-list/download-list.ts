import { Component, Inject, OnDestroy, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Buttons } from '../../shared/buttons/buttons'; // apne buttons component ka path
import { DownloadItem } from '../../../datatype';
import {
  DOWNLOAD_COVER_PALETTE,
  DOWNLOAD_LIMIT,
  DOWNLOAD_MONTHLY_LIMIT,
  DOWNLOAD_PAGE_TEXT,
  MENU_ROUTES,
  MOCK_DOWNLOAD_LIST,
  MOCK_DOWNLOAD_USED,
} from '../../core/mock-data';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common'; 

@Component({
  selector: 'app-download-list',
  imports: [Buttons,NgTemplateOutlet],
  templateUrl: './download-list.html',
  styleUrl: './download-list.scss',
})
export class DownloadList implements OnDestroy {
  text = DOWNLOAD_PAGE_TEXT;
  limit = DOWNLOAD_LIMIT;
  monthlyLimit = DOWNLOAD_MONTHLY_LIMIT;

  items = signal<DownloadItem[]>([]);
  used = signal(0);
  toast = signal('');

  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  // Kitne download bache / progress bar / buttons ka state
  left = computed(() => Math.max(0, this.limit - this.used()));
  usedShown = computed(() => Math.min(this.used(), this.limit));
  percent = computed(() => (this.usedShown() / this.limit) * 100);
  isFull = computed(() => this.left() < 1);
  canDownloadAll = computed(() => this.items().some((i) => !i.done) && !this.isFull());
  message = computed(() =>
    this.isFull()
      ? 'Download limit reached. New downloads open in your next plan period.'
      : `${this.left()} downloads left`,
  );

  constructor(
    private router: Router,
    @Inject(DOCUMENT) private doc: Document,
  ) {
    // Api aane par: this.api.getDownloadList().subscribe(...) lagana
    this.items.set(MOCK_DOWNLOAD_LIST.map((i) => ({ ...i })));
    this.used.set(MOCK_DOWNLOAD_USED);
  }

  ngOnDestroy(): void {
    clearTimeout(this.toastTimer);
  }

  /* ---------- Cover ka colour (title se fixed colour milta hai) ---------- */
  coverStyle(title: string): string {
    const hash = [...title].reduce((a, c) => a + c.charCodeAt(0), 0);
    const [c, c2] = DOWNLOAD_COVER_PALETTE[hash % DOWNLOAD_COVER_PALETTE.length];
    return `--c:${c};--c2:${c2}`;
  }

  /* ---------- Actions ---------- */
  addMore(): void {
    this.router.navigate([MENU_ROUTES['lib']]);
  }

  download(item: DownloadItem): void {
    // Pehle se downloaded hai to dobara file do, limit count mat badhao
    if (item.done) {
      this.triggerFile(item);
      return;
    }
    this.startDownload(item);
  }

  downloadAll(): void {
    if (!this.canDownloadAll()) return;
    let count = 0;
    for (const item of this.items()) {
      if (item.done) continue;
      if (!this.startDownload(item)) break;
      count++;
    }
    if (count) this.showToast(`${count} proposal(s) downloaded`);
  }

  remove(item: DownloadItem): void {
    // Api aane par: this.api.removeFromDownloadList(item.id)
    this.items.update((list) => list.filter((i) => i.id !== item.id));
    this.showToast('Removed from your list');
  }

  /* ---------- Private helpers ---------- */
  private startDownload(item: DownloadItem): boolean {
    if (this.isFull()) {
      this.showToast(`Download limit (${this.limit}) reached.`);
      return false;
    }
    this.used.update((u) => u + 1);
    this.items.update((list) => list.map((i) => (i.id === item.id ? { ...i, done: true } : i)));
    this.triggerFile(item);
    return true;
  }

  private triggerFile(item: DownloadItem): void {
    const a = this.doc.createElement('a');
    let blobUrl = '';

    if (item.url) {
      // Real file
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.download = `sample-proposal-${item.id}.pdf`;
    } else {
      // Dummy file (jab tak real url nahi aata)
      blobUrl = URL.createObjectURL(
        new Blob([`Sample Proposal: ${item.title}`], { type: 'text/plain' }),
      );
      a.href = blobUrl;
      a.download = `sample-proposal-${item.id}.txt`;
    }

    this.doc.body.appendChild(a);
    a.click();
    a.remove();
    if (blobUrl) setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }

  private showToast(message: string): void {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2200);
  }
}