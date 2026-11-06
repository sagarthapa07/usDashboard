import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination {
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  // Page size ke options
 @Input() sizes: number[] = [10, 25, 50, 100];

  // Custom dropdown khula hai ya nahi
  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  /* Total pages */
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  /* Page numbers: 1 2 … 9 10 jaisa (beech ke chhupa dete hain) */
  get pages(): (number | string)[] {
    const total = this.totalPages;
    const out: (number | string)[] = [];

    for (let i = 1; i <= total; i++) {
      if (i <= 2 || i === total || Math.abs(i - this.currentPage) < 2) {
        out.push(i);
      } else if (out[out.length - 1] !== '…') {
        out.push('…');
      }
    }
    return out;
  }

  /* Kisi bhi page par jao (1 se totalPages ke beech hi) */
  goTo(page: number | string): void {
    const n = Math.min(this.totalPages, Math.max(1, Number(page) || 1));
    if (n !== this.currentPage) {
      this.pageChange.emit(n);
    }
  }

  /* Dropdown open / close */
  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  /* Page size chuno */
  pickSize(size: number): void {
    this.isOpen = false;
    if (size !== this.pageSize) {
      this.pageSizeChange.emit(size);
    }
  }

  /* Dropdown ke bahar click karne par band */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  /* Esc dabane par band */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen = false;
  }
}