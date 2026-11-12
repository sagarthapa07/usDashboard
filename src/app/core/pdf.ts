import { Injectable } from '@angular/core';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentLoadingTask, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import { PDF_WORKER_SRC } from './mock-data';

pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

@Injectable({ providedIn: 'root' })
export class PdfService {
  open(url: string): PDFDocumentLoadingTask {
    return pdfjs.getDocument({ url });
  }

  // rotation = extra rotation (0, 90, 180, 270). Retina par bhi sharp
  renderPage(page: PDFPageProxy, canvas: HTMLCanvasElement, scale: number, rotation = 0): RenderTask {
    const dpr = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale, rotation: (page.rotate + rotation) % 360 });
    const ctx = canvas.getContext('2d')!;

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    return page.render({
      canvasContext: ctx,
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
    });
  }

  // Print ke liye page ko image bana deta hai
  async toDataUrl(page: PDFPageProxy, scale: number, rotation = 0): Promise<string> {
    const viewport = page.getViewport({ scale, rotation: (page.rotate + rotation) % 360 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.92);
  }
}