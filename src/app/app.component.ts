import { Component, OnInit } from '@angular/core';
import { JobService } from './job.service';
import { Job } from './job.interface';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { FilterBarComponent } from './filter-bar/filter-bar.component';
import { JobListComponent } from './job-list/job-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SearchBarComponent, FilterBarComponent, JobListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  jobs: Job[] = [];
  allJobs: Job[] = [];
  filteredJobs: Job[] = [];
  loading = false;
  error = '';
  loadingText = 'Searching…';
  loadingProgress = '';

  sortBy = 'date';
  activeSource = 'all';
  sources: string[] = ['all'];

  private progressTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(private jobService: JobService) {}

  ngOnInit(): void {
    this.loadInitialJobs();
  }

  private loadInitialJobs(): void {
    this.loading = true;
    this.loadingText = 'Loading latest jobs…';
    this.loadingProgress = 'Gathering opportunities…';

    this.jobService.fetchInitialJobs()
      .then(jobs => {
        this.loading = false;
        this.allJobs = jobs;
        this.applyFilters();
      })
      .catch(() => {
        this.loading = false;
        // Silent fail — user can still search
      });
  }

  onSearch(query: string): void {
    this.loading = true;
    this.error = '';
    this.jobs = [];
    this.allJobs = [];
    this.filteredJobs = [];
    this.loadingText = `Searching for "${query}"…`;
    this.loadingProgress = 'Searching Himalayas…';

    this.progressTimers.forEach(t => clearTimeout(t));
    this.progressTimers = [
      setTimeout(() => { if (this.loading) this.loadingProgress = 'Still searching — trying alternative sources…'; }, 5000),
      setTimeout(() => { if (this.loading) this.loadingProgress = 'Hang tight — job boards can be slow…'; }, 12000),
    ];

    this.jobService.searchJobs(query)
      .then(jobs => {
        this.progressTimers.forEach(t => clearTimeout(t));
        this.loading = false;
        this.allJobs = jobs;
        this.applyFilters();
        if (jobs.length === 0) {
          this.error = 'No results found. Try a different search term.';
        }
      })
      .catch(err => {
        this.progressTimers.forEach(t => clearTimeout(t));
        this.loading = false;
        this.error = err.message;
      });
  }

  onRetry(): void {
    if (this.allJobs.length > 0) {
      this.error = '';
      this.applyFilters();
    }
  }

  onSourceChange(source: string): void {
    this.activeSource = source;
    this.applyFilters();
  }

  onSortChange(sort: string): void {
    this.sortBy = sort;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.allJobs];
    if (this.activeSource !== 'all') {
      filtered = filtered.filter(j => j._provider === this.activeSource);
    }
    filtered = this.jobService.sortJobs(filtered, this.sortBy);
    this.filteredJobs = filtered;
    this.jobs = filtered;
    this.updateSources();
  }

  private updateSources(): void {
    const set = new Set<string>();
    this.allJobs.forEach(j => set.add(j._provider));
    this.sources = ['all', ...Array.from(set)];
  }
}
