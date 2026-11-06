import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../../core/api';
import { DropdownItem, GrantFilter } from '../../../datatype';

@Component({
  selector: 'app-grant-search-filter',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './grant-search-filter.html',
  styleUrl: './grant-search-filter.scss',
})
export class GrantSearchFilter implements OnInit {
  @Output() search = new EventEmitter<GrantFilter>();
  @Output() reset = new EventEmitter<void>();

  states: DropdownItem[] = [];
  areas: DropdownItem[] = [];

  loadingStates = false;
  loadingAreas = false;

  filter: GrantFilter = {
    state: '',
    areaOfInterest: '',
    publishedFrom: '',
    publishedTo: '',
  };

  // Constructor injection
  constructor(private api: Api) {}

  // Component khulte hi dono API call hongi
  ngOnInit(): void {
    this.loadStates();
    this.loadAreas();
  }

  loadStates(): void {

  }

  loadAreas(): void {

  }

  onSearch(): void {
    this.search.emit({ ...this.filter });
  }

  onReset(): void {
    this.filter = {
      state: '',
      areaOfInterest: '',
      publishedFrom: '',
      publishedTo: '',
    };
    this.reset.emit();
  }
}