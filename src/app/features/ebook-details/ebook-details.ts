import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SampleProposalTagColor } from '../../../datatype';
import {
  DEMO_PDF_URL,
  EB_AREA_ICONS,
  EB_DEFAULT_ICON,
  EB_DETAIL_TEXT,
  EB_PAGE_TEXT,
  EB_ROUTE_LIST,
  SP_TAG_COLORS,
  getEbook,
} from '../../core/mock-data';
import { PdfViewer } from '../../shared/pdf-viewer/pdf-viewer';

@Component({
  selector: 'app-ebook-detail',
  standalone: true,
  imports: [DatePipe, PdfViewer],
  templateUrl: './ebook-details.html',
  styleUrl: './ebook-details.scss',
})
export class EbookDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('viewerEl') viewerEl?: ElementRef<HTMLElement>;

  readonly text = EB_DETAIL_TEXT;
  readonly listText = EB_PAGE_TEXT;

  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  });

  // Baad me API: this.api.getEbook(id)
  ebook = computed(() => getEbook(this.id()));
  pdfUrl = computed(() => this.ebook()?.pdfUrl || DEMO_PDF_URL);
  fileName = computed(() => {
    const t = this.ebook()?.title ?? 'ebook';
    return `${t.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
  });

  isFav = signal(false);
  toast = signal('');
  private toastTimer?: ReturnType<typeof setTimeout>;

  iconFor(area: string): string {
    return EB_AREA_ICONS[area] ?? EB_DEFAULT_ICON;
  }

  tagColor(area: string): SampleProposalTagColor {
    const sum = Array.from(area).reduce((a, c) => a + c.charCodeAt(0), 0);
    return SP_TAG_COLORS[sum % SP_TAG_COLORS.length];
  }

  goBack(): void {
    this.router.navigate([EB_ROUTE_LIST]);
  }

  readOnline(): void {
    this.viewerEl?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleFav(): void {
    this.isFav.set(!this.isFav());
    // TODO: favorites API
  }

  download(): void {
    window.open(this.pdfUrl(), '_blank', 'noopener');
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.showToast(this.text.linkCopied);
    } catch {
      this.showToast(this.text.copyFailed);
    }
  }

  private showToast(msg: string): void {
    clearTimeout(this.toastTimer);
    this.toast.set(msg);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2200);
  }
}