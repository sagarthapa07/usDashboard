import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SampleProposalTagColor } from '../../../datatype';
import {
  DEMO_PDF_URL,
  SP_AREA_ICONS,
  SP_DEFAULT_ICON,
  SP_DETAIL_TEXT,
  SP_PAGE_TEXT,
  SP_ROUTE_LIST,
  SP_TAG_COLORS,
  getSampleProposal,
} from '../../core/mock-data';
import { PdfViewer } from '../../shared/pdf-viewer/pdf-viewer';

@Component({
  selector: 'app-sample-proposal-details',
  standalone: true,
  imports: [DatePipe, PdfViewer],
  templateUrl: './sample-proposal-details.html',
  styleUrl: './sample-proposal-details.scss',
})
export class SampleProposalDetails {


    private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('viewerEl') viewerEl?: ElementRef<HTMLElement>;

  readonly text = SP_DETAIL_TEXT;
  readonly listText = SP_PAGE_TEXT; // cover ka text (coverTag, coverBrand, pdfLabel...)

  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  });

  // Baad me API: this.api.getSampleProposal(id)
  proposal = computed(() => getSampleProposal(this.id()));
  pdfUrl = computed(() => this.proposal()?.pdfUrl || DEMO_PDF_URL);
  fileName = computed(() => {
    const t = this.proposal()?.title ?? 'sample-proposal';
    return `${t.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
  });

  inList = signal(false);
  isFav = signal(false);
  toast = signal('');
  private toastTimer?: ReturnType<typeof setTimeout>;

  iconFor(area: string): string {
    return SP_AREA_ICONS[area] ?? SP_DEFAULT_ICON;
  }

  tagColor(area: string): SampleProposalTagColor {
    const sum = Array.from(area).reduce((a, c) => a + c.charCodeAt(0), 0);
    return SP_TAG_COLORS[sum % SP_TAG_COLORS.length];
  }

  goBack(): void {
    this.router.navigate([SP_ROUTE_LIST]);
  }

  readOnline(): void {
    this.viewerEl?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleList(): void {
    this.inList.set(!this.inList());
    // TODO: download-list store / API ban jaye to yahan add/remove call karna
  }

  toggleFav(): void {
    this.isFav.set(!this.isFav());
    // TODO: favorites API
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
