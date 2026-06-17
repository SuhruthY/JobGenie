import { Injectable } from '@angular/core';
import { Job } from './job.interface';

interface Provider {
  name: string;
  fetch: (query: string) => Promise<Job[]>;
}

@Injectable({ providedIn: 'root' })
export class JobService {
  private readonly FETCH_TIMEOUT_MS = 15000;
  private readonly MAX_JOB_AGE_DAYS = 60;

  private readonly searchProviders: Provider[] = [
    { name: 'himalayas', fetch: (q) => this.fetchHimalayas(q) },
    { name: 'remotive', fetch: (q) => this.fetchRemotive(q) },
    { name: 'remoteok', fetch: (q) => this.fetchRemoteOK(q) },
  ];

  /* ─── Initial diversified feed ─────────────── */

  async fetchInitialJobs(): Promise<Job[]> {
    // Fetch from all providers without search terms for maximum diversity
    const results = await Promise.allSettled([
      this.fetchHimalayasBrowse(),
      this.fetchRemotive(''),
      this.fetchRemoteOK(''),
    ]);

    const all: Job[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') all.push(...r.value);
    }
    const active = all.filter(j => !this.isExpired(j) && !this.isTooOld(j));
    // Deduplicate by title+company
    const seen = new Set<string>();
    const deduped = active.filter(j => {
      const key = `${j.title}|${j.companyName}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Shuffle to show diversity (not all from one provider)
    return this.shuffle(this.sortJobs(this.enrichJobs(deduped), 'date')).slice(0, 40);
  }

  /* ─── Search with accumulation ─────────────── */

  async searchJobs(query: string): Promise<Job[]> {
    const errors: string[] = [];
    const all: Job[] = [];

    for (const provider of this.searchProviders) {
      try {
        const raw = await provider.fetch(query);
        all.push(...raw);
      } catch (err: any) {
        console.warn(`[JobService] Provider "${provider.name}" failed:`, err.message);
        errors.push(`${provider.name}: ${err.message}`);
      }
    }

    if (all.length === 0) {
      if (errors.length === this.searchProviders.length) {
        throw new Error(`All job search providers failed.\n${errors.join('\n')}`);
      }
      return [];
    }

    const active = all.filter(j => !this.isExpired(j) && !this.isTooOld(j));
    const enriched = this.enrichJobs(active);

    // Relevance filter: show jobs whose title/description mention at least one query term
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (terms.length > 0) {
      const matching = enriched.filter(j => {
        const text = `${j.title} ${j.description} ${j.companyName}`.toLowerCase();
        return terms.some(t => text.includes(t));
      });
      // If we have matching results, use those; otherwise fall back to all results
      if (matching.length > 0) return this.sortJobs(matching, 'date');
    }

    return this.sortJobs(enriched, 'date');
  }

  sortJobs(jobs: Job[], sortBy: string): Job[] {
    const sorted = [...jobs];
    switch (sortBy) {
      case 'salary':
        sorted.sort((a, b) => (b.maxSalary || b.minSalary || 0) - (a.maxSalary || a.minSalary || 0));
        break;
      case 'relevance':
        sorted.sort((a, b) => (a.expiryDate || a.pubDate || 0) - (b.expiryDate || b.pubDate || 0));
        break;
      default:
        sorted.sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0));
    }
    return sorted;
  }

  /* ─── HTTP helper ──────────────────────────── */

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  /* ─── Provider: Himalayas ──────────────────── */

  private async fetchHimalayasBrowse(): Promise<Job[]> {
    const res = await this.fetchWithTimeout('https://himalayas.app/jobs/api');
    if (!res.ok) throw new Error(`Himalayas browse API returned ${res.status}`);
    const data = await res.json();
    return (data.jobs || []).map((j: any) => this.normalizeHimalayas(j));
  }

  private async fetchHimalayas(query: string): Promise<Job[]> {
    const params = new URLSearchParams({ q: query, sort: 'recent', page: '1' });
    const res = await this.fetchWithTimeout(`https://himalayas.app/jobs/api/search?${params}`);
    if (!res.ok) throw new Error(`Himalayas API returned ${res.status}`);
    const data = await res.json();
    return (data.jobs || []).map((j: any) => this.normalizeHimalayas(j));
  }

  private normalizeHimalayas(j: any): Job {
    if (!j) j = {};
    return this.makeJob({
      title: j.title,
      companyName: j.companyName,
      applicationLink: j.applicationLink,
      pubDate: j.pubDate,
      expiryDate: j.expiryDate,
      minSalary: j.minSalary,
      maxSalary: j.maxSalary,
      currency: j.currency,
      locationRestrictions: Array.isArray(j.locationRestrictions) ? j.locationRestrictions : [],
      description: j.description,
      employmentType: j.employmentType,
      companyLogo: j.companyLogo,
      _provider: 'himalayas',
    });
  }

  /* ─── Provider: Remotive ───────────────────── */

  private async fetchRemotive(query: string): Promise<Job[]> {
    const url = query
      ? `https://remotive.com/api/remote-jobs?${new URLSearchParams({ search: query })}`
      : 'https://remotive.com/api/remote-jobs';
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Remotive API returned ${res.status}`);
    const data = await res.json();
    return (data.jobs || []).map((j: any) => this.normalizeRemotive(j));
  }

  private normalizeRemotive(j: any): Job {
    if (!j) j = {};
    let pubDate: number | null = null;
    if (j.publication_date) pubDate = Math.floor(new Date(j.publication_date).getTime() / 1000);
    const location = j.candidate_required_location
      ? String(j.candidate_required_location).split(',').map((s: string) => s.trim()).filter(Boolean)
      : ['Remote'];
    return this.makeJob({
      title: j.title,
      companyName: j.company_name,
      applicationLink: j.url,
      pubDate,
      minSalary: null, maxSalary: null, currency: null,
      locationRestrictions: location,
      description: j.description,
      employmentType: j.job_type ? String(j.job_type).replace(/_/g, ' ') : null,
      companyLogo: j.company_logo,
      _provider: 'remotive',
    });
  }

  /* ─── Provider: RemoteOK ───────────────────── */

  private async fetchRemoteOK(query: string): Promise<Job[]> {
    const params = query ? `?${new URLSearchParams({ keyword: query })}` : '';
    const res = await this.fetchWithTimeout(`https://remoteok.com/api${params}`);
    if (!res.ok) throw new Error(`RemoteOK API returned ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((j: any) => j && j.id && j.position).map((j: any) => this.normalizeRemoteOK(j));
  }

  private normalizeRemoteOK(j: any): Job {
    if (!j) j = {};
    let pubDate: number | null = null;
    if (j.date) pubDate = Math.floor(new Date(j.date).getTime() / 1000);
    return this.makeJob({
      title: j.position,
      companyName: j.company,
      applicationLink: j.apply_url || j.url,
      pubDate,
      minSalary: null, maxSalary: null, currency: null,
      locationRestrictions: j.location ? [String(j.location)] : ['Remote'],
      description: j.description,
      employmentType: null, companyLogo: j.company_logo,
      _provider: 'remoteok',
    });
  }

  /* ─── Helpers ──────────────────────────────── */

  private makeJob(src: any): Job {
    return {
      title: src.title || 'Untitled',
      companyName: src.companyName || 'Unknown',
      applicationLink: src.applicationLink || null,
      pubDate: src.pubDate || null,
      expiryDate: src.expiryDate || null,
      minSalary: src.minSalary || null,
      maxSalary: src.maxSalary || null,
      currency: src.currency || null,
      locationRestrictions: src.locationRestrictions || [],
      description: src.description || '',
      employmentType: src.employmentType || null,
      companyLogo: src.companyLogo || null,
      _provider: src._provider || 'unknown',
      _salary: null as any,
      _posted: null as any,
      _expiresIn: 60,
      _expiryStatus: 'active',
      _snippet: null as any,
    };
  }

  private isExpired(job: Job): boolean {
    if (!job.expiryDate) return false;
    return job.expiryDate * 1000 < Date.now();
  }

  private isTooOld(job: Job): boolean {
    if (!job.pubDate) return false;
    const ageDays = (Date.now() - (job.pubDate * 1000)) / (1000 * 60 * 60 * 24);
    return ageDays > this.MAX_JOB_AGE_DAYS;
  }

  private enrichJobs(jobs: Job[]): Job[] {
    return jobs.map(j => {
      const expDays = this.daysUntilExpiry(j);
      return {
        ...j,
        _salary: this.formatSalary(j),
        _posted: this.formatDate(j.pubDate),
        _expiresIn: expDays,
        _expiryStatus: expDays <= 0 ? 'expired' : expDays <= 7 ? 'soon' : 'active',
        _snippet: (j.description || '')
          .replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ')
          .replace(/\s+/g, ' ').trim().substring(0, 250),
      };
    });
  }

  private daysUntilExpiry(job: Job): number {
    if (!job.expiryDate) return 60;
    return Math.round(((job.expiryDate * 1000) - Date.now()) / (1000 * 60 * 60 * 24));
  }

  private formatDate(unixTimestamp: number | null): string {
    if (!unixTimestamp) return '';
    const diffDays = Math.floor((Date.now() - (unixTimestamp * 1000)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  private formatSalary(job: Job): string | null {
    if (!job.minSalary && !job.maxSalary) return null;
    const currency = job.currency || 'USD';
    const fmt = (val: number | null) => {
      if (!val) return '';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);
    };
    if (job.minSalary && job.maxSalary) return `${fmt(job.minSalary)} – ${fmt(job.maxSalary)}`;
    if (job.minSalary) return `From ${fmt(job.minSalary)}`;
    if (job.maxSalary) return `Up to ${fmt(job.maxSalary)}`;
    return null;
  }

  private shuffle(arr: Job[]): Job[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
