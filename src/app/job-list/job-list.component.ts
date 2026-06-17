import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Job } from '../job.interface';
import { JobCardComponent } from '../job-card/job-card.component';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [JobCardComponent],
  template: `
    @if (loading) {
      <div class="loading">
        <div class="loading__spinner"></div>
        <p class="loading__text">{{ loadingText }}</p>
        @if (loadingProgress) {
          <p class="loading__progress">{{ loadingProgress }}</p>
        }
      </div>
    } @else if (error) {
      <div class="state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
        </svg>
        <h3>Something went wrong</h3>
        <p>{{ error }}</p>
        <button class="btn-retry" (click)="retry.emit()">Try Again</button>
      </div>
    } @else if (jobs.length === 0 && !initial) {
      <div class="state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <h3>No jobs found</h3>
        <p>{{ emptyText }}</p>
      </div>
    } @else if (initial) {
      <div class="state state--welcome">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="56" height="56">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
        <h3>Find your next job</h3>
        <p>Search for a job title or keyword above to get started.</p>
      </div>
    } @else {
      <div class="toolbar">
        <div class="toolbar__info">
          <span class="toolbar__count">{{ totalCount }}</span> jobs found
          @if (sourceSummary) {
            <span class="toolbar__sources">({{ sourceSummary }})</span>
          }
        </div>
      </div>
      <div class="grid">
        @for (job of jobs; track $index) {
          <app-job-card [job]="job" />
        }
      </div>
    }
  `,
  styles: [`
    .loading { text-align: center; padding: 60px 0; }
    .loading__spinner {
      width: 44px; height: 44px; border: 4px solid #E2E8F0; border-top-color: #4F46E5;
      border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading__text { font-size: 15px; color: #64748B; }
    .loading__progress { font-size: 13px; color: #94A3B8; margin-top: 8px; }
    .state { text-align: center; padding: 60px 0; color: #64748B; }
    .state svg { color: #94A3B8; margin-bottom: 16px; }
    .state h3 { font-size: 18px; font-weight: 600; color: #0F172A; margin-bottom: 8px; }
    .state p { font-size: 14px; max-width: 400px; margin: 0 auto; }
    .state--welcome svg { color: #4F46E5; }
    .state--welcome h3 { font-size: 22px; color: #4F46E5; }
    .btn-retry {
      margin-top: 16px; padding: 10px 24px; background: #4F46E5; color: #fff;
      border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background 0.2s;
    }
    .btn-retry:hover { background: #4338CA; }
    .toolbar {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; margin-bottom: 20px;
      padding: 16px 20px; background: #fff; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .toolbar__count { font-size: 15px; font-weight: 600; }
    .toolbar__sources { font-size: 12px; font-weight: 400; color: #94A3B8; margin-left: 6px; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class JobListComponent {
  @Input() jobs: Job[] = [];
  @Input() loading = false;
  @Input() error = '';
  @Input() initial = true;
  @Input() loadingText = 'Searching…';
  @Input() loadingProgress = '';
  @Input() emptyText = 'No matching jobs found. Try a different search term.';
  @Output() retry = new EventEmitter<void>();
  // We'll compute summary from jobs
  get totalCount(): number { return this.jobs.length; }
  get sourceSummary(): string {
    const counts: Record<string, number> = {};
    this.jobs.forEach(j => { const p = j._provider || 'unknown'; counts[p] = (counts[p] || 0) + 1; });
    return Object.entries(counts).map(([p, c]) => `${c} ${p}`).join(', ');
  }
}
