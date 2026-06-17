import { Component, Input } from '@angular/core';
import { Job } from '../job.interface';

@Component({
  selector: 'app-job-card',
  standalone: true,
  template: `
    <div class="job-card" [attr.data-provider]="job._provider">
      <div class="job-card__header">
        <div class="job-card__info">
          <div class="job-card__title">{{ job.title }}</div>
          <div class="job-card__company">{{ job.companyName }}</div>
        </div>
        <div class="job-card__logo">
          @if (job.companyLogo) {
            <img [src]="job.companyLogo" [alt]="job.companyName" loading="lazy" />
          } @else {
            {{ (job.companyName || '?').charAt(0).toUpperCase() }}
          }
        </div>
      </div>

      <div class="job-card__meta">
        <span class="job-card__meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          {{ job.employmentType || 'N/A' }}
        </span>
        <span class="job-card__meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ location }}
        </span>
        @if (job._salary) {
          <span class="job-card__meta-item job-card__salary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            {{ job._salary }}
          </span>
        }
        <span class="job-card__expiry-badge" [class.job-card__expiry-badge--active]="job._expiryStatus === 'active'"
              [class.job-card__expiry-badge--soon]="job._expiryStatus === 'soon'"
              [class.job-card__expiry-badge--expired]="job._expiryStatus === 'expired'">
          @if (job._expiryStatus === 'soon') { {{ job._expiresIn }}d left }
          @else if (job._expiryStatus === 'expired') { Expired }
          @else { Active }
        </span>
        <span class="job-card__source-badge">{{ job._provider }}</span>
      </div>

      <div class="job-card__snippet">{{ job._snippet || 'No description available.' }}</div>

      <div class="job-card__footer">
        <span class="job-card__date">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Posted {{ job._posted || 'recently' }}
        </span>
        <a [href]="job.applicationLink || '#'" target="_blank" rel="noopener noreferrer" class="job-card__apply">
          Apply Now
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .job-card {
      background: #fff; border-radius: 12px; padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      transition: box-shadow 0.25s, transform 0.25s;
      display: flex; flex-direction: column; gap: 12px;
      animation: fadeIn 0.3s ease both;
      border-left: 3px solid #EEF2FF; position: relative;
    }
    .job-card:hover { box-shadow: 0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04); transform: translateY(-2px); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .job-card:nth-child(1) { animation-delay: 0.00s; }
    .job-card:nth-child(2) { animation-delay: 0.04s; }
    .job-card:nth-child(3) { animation-delay: 0.08s; }
    .job-card:nth-child(4) { animation-delay: 0.12s; }
    .job-card:nth-child(5) { animation-delay: 0.16s; }
    .job-card:nth-child(6) { animation-delay: 0.20s; }
    .job-card:nth-child(7) { animation-delay: 0.24s; }
    .job-card:nth-child(8) { animation-delay: 0.28s; }
    .job-card__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .job-card__info { flex: 1; min-width: 0; }
    .job-card__title { font-size: 17px; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .job-card__company { font-size: 14px; color: #64748B; margin-top: 2px; }
    .job-card__logo {
      width: 44px; height: 44px; border-radius: 10px; background: #EEF2FF; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; overflow: hidden;
      font-size: 18px; font-weight: 700; color: #4F46E5; box-shadow: 0 1px 3px rgba(79,70,229,0.15);
    }
    .job-card__logo img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
    .job-card__meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 13px; color: #64748B; }
    .job-card__meta-item {
      display: inline-flex; align-items: center; gap: 4px;
      background: #F8FAFC; padding: 3px 10px; border-radius: 6px; border: 1px solid #E2E8F0;
    }
    .job-card__meta-item svg { width: 14px; height: 14px; }
    .job-card__salary { font-weight: 600; color: #10B981; }
    .job-card__snippet {
      font-size: 14px; color: #64748B; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .job-card__footer {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-top: 4px;
    }
    .job-card__date { font-size: 12px; color: #94A3B8; display: flex; align-items: center; gap: 4px; }
    .job-card__date svg { width: 14px; height: 14px; }
    .job-card__apply {
      display: inline-flex; align-items: center; gap: 6px;
      background: #4F46E5; color: #fff; text-decoration: none;
      padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 500;
      transition: background 0.2s;
    }
    .job-card__apply:hover { background: #4338CA; }
    .job-card__apply svg { width: 16px; height: 16px; }
    .job-card__expiry-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
    .job-card__expiry-badge--soon { background: #FEF3C7; color: #92400E; }
    .job-card__expiry-badge--active { background: #D1FAE5; color: #065F46; }
    .job-card__expiry-badge--expired { background: #FEE2E2; color: #991B1B; }
    .job-card__source-badge {
      font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 10px;
      text-transform: uppercase; letter-spacing: 0.5px;
      background: #E2E8F0; color: #94A3B8;
    }
    .job-card[data-provider="himalayas"] .job-card__source-badge { background: #EEF2FF; color: #4F46E5; }
    .job-card[data-provider="remotive"] .job-card__source-badge { background: #F0FDF4; color: #16A34A; }
    .job-card[data-provider="remoteok"] .job-card__source-badge { background: #FFF7ED; color: #EA580C; }
  `]
})
export class JobCardComponent {
  @Input() job!: Job;

  get location(): string {
    const loc = this.job.locationRestrictions;
    return loc && loc.length > 0 ? loc.join(', ') : 'Remote';
  }
}
