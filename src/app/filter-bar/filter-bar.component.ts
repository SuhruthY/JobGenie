import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  template: `
    <div class="filter-bar">
      <div class="filter-bar__group">
        <label class="filter-bar__label">Source</label>
        <div class="filter-bar__chips">
          @for (s of sources; track s) {
            <button class="filter-bar__chip" [class.active]="activeSource === s" (click)="setSource(s)">
              {{ s }}
            </button>
          }
        </div>
      </div>
      <div class="filter-bar__group">
        <label class="filter-bar__label">Sort</label>
        <select class="filter-bar__select" [value]="sortBy" (change)="setSort($event)">
          <option value="date">Newest</option>
          <option value="salary">Salary</option>
          <option value="relevance">Urgency</option>
        </select>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; margin-bottom: 20px;
      padding: 14px 20px; background: #fff; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .filter-bar__group { display: flex; align-items: center; gap: 10px; }
    .filter-bar__label { font-size: 13px; font-weight: 500; color: #64748B; text-transform: uppercase; letter-spacing: 0.3px; }
    .filter-bar__chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-bar__chip {
      padding: 4px 12px; border-radius: 20px; border: 1px solid #E2E8F0;
      background: #fff; font-size: 12px; font-weight: 500; color: #64748B;
      cursor: pointer; transition: all 0.15s;
    }
    .filter-bar__chip.active { background: #EEF2FF; border-color: #4F46E5; color: #4F46E5; }
    .filter-bar__chip:hover:not(.active) { border-color: #4F46E5; }
    .filter-bar__select {
      padding: 6px 12px; border: 1px solid #E2E8F0; border-radius: 8px;
      font-size: 13px; font-family: inherit; background: #fff; cursor: pointer;
      outline: none;
    }
    .filter-bar__select:focus { border-color: #4F46E5; }
  `]
})
export class FilterBarComponent {
  @Input() sources: string[] = [];
  @Input() activeSource = 'all';
  @Input() sortBy = 'date';
  @Output() sourceChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();

  setSource(s: string): void { this.sourceChange.emit(s); }
  setSort(e: Event): void { this.sortChange.emit((e.target as HTMLSelectElement).value); }
}
