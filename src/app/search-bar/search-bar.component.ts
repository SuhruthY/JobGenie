import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  template: `
    <div class="search-bar">
      <div class="search-bar__inner">
        <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          class="search-bar__input"
          type="text"
          placeholder="Search jobs… e.g. Java Developer, React Engineer, Data Scientist"
          [value]="query"
          (input)="onInput($event)"
          (keydown.enter)="onSearch()"
        />
        <button class="search-bar__btn" (click)="onSearch()" [disabled]="!query.trim() || searching">
          @if (searching) {
            <span class="btn-spinner"></span>
            Searching…
          } @else {
            <span>Search</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .search-bar { margin-bottom: 24px; }
    .search-bar__inner {
      display: flex; gap: 0;
      background: #fff; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .search-bar__inner:focus-within { box-shadow: 0 0 0 3px rgba(79,70,229,0.15), 0 1px 3px rgba(0,0,0,0.06); }
    .search-bar__icon {
      width: 20px; height: 20px; color: #94A3B8;
      margin: 14px 0 14px 16px; flex-shrink: 0;
    }
    .search-bar__input {
      flex: 1; border: none; padding: 12px 12px;
      font-size: 15px; font-family: inherit; outline: none;
      color: #0F172A; background: transparent;
    }
    .search-bar__input::placeholder { color: #94A3B8; }
    .search-bar__btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: #4F46E5; color: #fff; border: none;
      padding: 12px 24px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background 0.2s;
      white-space: nowrap;
    }
    .search-bar__btn:hover:not(:disabled) { background: #4338CA; }
    .search-bar__btn:disabled { background: #94A3B8; cursor: not-allowed; }
    .btn-spinner {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SearchBarComponent {
  @Output() search = new EventEmitter<string>();
  query = '';
  searching = false;

  onInput(e: Event): void {
    this.query = (e.target as HTMLInputElement).value;
  }

  onSearch(): void {
    const q = this.query.trim();
    if (q) this.search.emit(q);
  }
}
