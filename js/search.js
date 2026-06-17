/**
 * search.js — Searches for jobs using the Himalayas free public API.
 * No API key required. CORS-enabled for browser requests.
 * Filters expired jobs and sorts results by date/salary/relevance.
 */

const Search = (() => {
  'use strict';

  // Himalayas API endpoints — free, no auth, CORS-enabled
  const API_BROWSE = 'https://himalayas.app/jobs/api';
  const API_SEARCH = 'https://himalayas.app/jobs/api/search';

  // Maximum jobs we consider expired (in days from posted date)
  const MAX_JOB_AGE_DAYS = 60;

  /**
   * Fetch jobs from Himalayas search API with keyword query.
   * Uses the search endpoint for keyword matching and sort by recent.
   */
  async function fetchJobs(query, page = 1) {
    const params = new URLSearchParams({
      q: query,
      sort: 'recent',
      page: page.toString()
    });

    const url = `${API_SEARCH}?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Himalayas API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.jobs || [];
  }

  /**
   * Check if a job has expired based on its expiryDate.
   * expiryDate is a unix timestamp (seconds).
   */
  function isExpired(job) {
    if (!job.expiryDate) return false;
    // expiryDate is in seconds, Date.now() is in milliseconds
    return job.expiryDate * 1000 < Date.now();
  }

  /**
   * Check if a job is too old (beyond the max age threshold)
   * based on pubDate (published timestamp in seconds).
   */
  function isTooOld(job) {
    if (!job.pubDate) return false;
    const ageMs = Date.now() - (job.pubDate * 1000);
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays > MAX_JOB_AGE_DAYS;
  }

  /**
   * How many days until a job expires (or has been expired).
   * Positive = still open, Negative = expired.
   */
  function daysUntilExpiry(job) {
    if (!job.expiryDate) return 60; // No expiry = assume 60 days
    const diffMs = (job.expiryDate * 1000) - Date.now();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Format a unix timestamp (seconds) into a readable relative date.
   */
  function formatDate(unixTimestamp) {
    if (!unixTimestamp) return '';
    const date = new Date(unixTimestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  /**
   * Format salary range for display.
   */
  function formatSalary(job) {
    if (!job.minSalary && !job.maxSalary) return null;
    const currency = job.currency || 'USD';
    const fmt = (val) => {
      if (!val) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
      }).format(val);
    };

    if (job.minSalary && job.maxSalary) {
      return `${fmt(job.minSalary)} - ${fmt(job.maxSalary)}`;
    }
    if (job.minSalary) return `From ${fmt(job.minSalary)}`;
    if (job.maxSalary) return `Up to ${fmt(job.maxSalary)}`;
    return null;
  }

  /**
   * Sort jobs by the selected criteria.
   */
  function sortJobs(jobs, sortBy) {
    const sorted = [...jobs];

    switch (sortBy) {
      case 'salary':
        // Sort by maxSalary descending, then minSalary descending
        sorted.sort((a, b) => {
          const aMax = a.maxSalary || a.minSalary || 0;
          const bMax = b.maxSalary || b.minSalary || 0;
          return bMax - aMax;
        });
        break;

      case 'relevance':
        // Sort by expiryDate (closest deadline first — urgency)
        sorted.sort((a, b) => {
          const aExp = a.expiryDate || a.pubDate || 0;
          const bExp = b.expiryDate || b.pubDate || 0;
          return aExp - bExp;
        });
        break;

      case 'date':
      default:
        // Sort by pubDate descending (newest first)
        sorted.sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0));
        break;
    }

    return sorted;
  }

  /**
   * Main search entry point.
   * 1. Calls Himalayas API with the keyword query
   * 2. Filters out expired jobs
   * 3. Filters out jobs older than MAX_JOB_AGE_DAYS
   * 4. Sorts by date (newest first) by default
   * Returns processed job array ready for display.
   */
  async function searchJobs(query) {
    const rawJobs = await fetchJobs(query);

    // Process: filter expired + too old, add display helpers
    const active = rawJobs.filter(job => !isExpired(job) && !isTooOld(job));

    // Enrich jobs with display-friendly fields
    const enriched = active.map(job => ({
      ...job,
      _salary: formatSalary(job),
      _posted: formatDate(job.pubDate),
      _expiresIn: daysUntilExpiry(job),
      _expiryStatus: daysUntilExpiry(job) <= 0 ? 'expired' :
                      daysUntilExpiry(job) <= 7 ? 'soon' : 'active',
      // Clean snippet: strip HTML tags, truncate
      _snippet: (job.description || job.excerpt || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&[^;]+;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 250)
    }));

    // Default sort by date (newest first)
    return sortJobs(enriched, 'date');
  }

  // Public API
  return { searchJobs, sortJobs, formatDate, formatSalary, daysUntilExpiry };
})();
