import { Component, Input } from '@angular/core';

export type ButtonVariant =
  | 'primary'        // solid blue (Search, View Details, Start course)
  | 'secondary'      // halka blue (Download PDF)
  | 'outline'        // blue border (Reset)
  | 'neutral'        // grey border (Save this search)
  | 'ghost'          // bina border (burger, back, icon buttons)
  | 'danger'         // solid red
  | 'danger-outline' // red border
  | 'success'        // solid green
  | 'navy'           // dark navy (Need help?)
  | 'link'           // text link (Advanced Search →)
  | 'link-danger'    // red underlined text (Clear all)
  | 'chip'           // chhota rounded box (All Types, Grants...)
  | 'pill'           // poora gol tab (Sample Proposals, EBooks...)
  | 'toggle';        // dashed pill (Closing in 30 days)

export type ButtonSize = 'sm' | 'md' | 'lg';



@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss',
})
export class Buttons {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Input() icon = '';       // aage ka icon, jaise 'bi-search'
  @Input() iconEnd = '';    // peeche ka icon, jaise 'bi-arrow-right'

  @Input() iconOnly = false; // sirf icon (text nahi)
  @Input() round = false;    // gol button (iconOnly ke saath)
  @Input() block = false;    // poori width
  @Input() active = false;   // chip / pill / toggle selected hai ya nahi
  @Input() disabled = false;
  @Input() loading = false;  // spinner dikhao aur click band
  @Input() ariaLabel = '';   // iconOnly me zaroor do

  // Selected / unselected wale buttons
  get isToggle(): boolean {
    return this.variant === 'chip' || this.variant === 'pill' || this.variant === 'toggle';
  }

  get classes(): string {
    return [
      'ub',
      `ub-${this.variant}`,
      `ub-${this.size}`,
      this.iconOnly ? 'ub-icon' : '',
      this.round ? 'ub-round' : '',
      this.active ? 'is-active' : '',
      this.loading ? 'is-loading' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}
