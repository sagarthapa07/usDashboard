import { Component } from '@angular/core';
import { BrandInfo, FooterInfo } from '../../../datatype';
import { MOCK_BRAND, MOCK_FOOTER } from '../../core/mock-data';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  /* DATA: mock-data.ts se (baad me API se aayega) */
  brand: BrandInfo = MOCK_BRAND;
  info: FooterInfo = MOCK_FOOTER;

  year = new Date().getFullYear();
}