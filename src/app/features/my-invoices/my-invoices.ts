import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { InvoiceItem, InvoiceStatus } from '../../../datatype';
import {
  INVOICE_COLUMNS,
  INVOICE_PAGE_TEXT,
  MOCK_INVOICES,
} from '../../core/mock-data'; // apne path ke hisaab se adjust karna

@Component({
  selector: 'app-my-invoices',
  imports: [DatePipe],
  templateUrl: './my-invoices.html',
  styleUrl: './my-invoices.scss',
})
export class MyInvoices {
  text = INVOICE_PAGE_TEXT;
  columns = INVOICE_COLUMNS;

  // Api aane par: this.api.getInvoices().subscribe((res) => this.invoices.set(res));
  invoices = signal<InvoiceItem[]>(MOCK_INVOICES);

  // Naye invoice sabse upar
  sortedInvoices = computed(() =>
    [...this.invoices()].sort((a, b) => (a.date < b.date ? 1 : -1)),
  );

  // Status badge ka colour class: success / pending / failed
  statusClass(status: InvoiceStatus): string {
    return status.toLowerCase();
  }
}