/**
 * search.js — Searches for jobs using multiple free public APIs.
 * Tries providers in order: Himalayas → Remotive → RemoteOK.
 * Filters expired jobs, enriches with display helpers, sorts by date.
 */

const Search = (() => {
  'use strict';

  const FETCH_TIMEOUT_MS = 15000;
  const MAX_JOB_AGE_DAYS = 60;

  /* ─── Shared Helpers ──────────────────────────────── */

  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs || FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  /* ─── Provider: Himalayas ─────────────────────────── */

  const HIMALAYAS_SEARCH = 'https://himalayas.app/jobs/api/search';

  async function fetchHimalayas(query) {
    const params = new URLSearchParams({ q: query, sort: 'recent', page: '1' });
    const res = await fetchWithTimeout(`${HIMALAYAS_SEARCH}?${params}`);
    if (!res.ok) throw new Error(`Himalayas API returned ${res.status}`);
    const data = await res.json();
    return (data.jobs || []).map(normalizeFromHimalayas);
  }

  function normalizeFromHimalayas(job) {
    if (!job) job = {};
    return {
      title: job.title || 'Untitled',
      companyName: job.companyName || 'Unknown',
      applicationLink: job.applicationLink || null,
      pubDate: job.pubDate || null,
      expiryDate: job.expiryDate || null,
      minSalary: job.minSalary || null,
      maxSalary: job.maxSalary || null,
      currency: job.currency || null,
      locationRestrictions: Array.isArray(job.locationRestrictions) ? job.locationRestrictions : [],
      description: job.description || '',
      employmentType: job.employmentType || null,
      companyLogo: job.companyLogo || null,
      _provider: 'himalayas',
    };
  }

  /* ─── Provider: Remotive ──────────────────────────── */

  const REMOTIVE_API = 'https://remotive.com/api/remote-jobs';

  async function fetchRemotive(query) {
    const params = new URLSearchParams({ search: query });
    const res = await fetchWithTimeout(`${REMOTIVE_API}?${params}`);
    if (!res.ok) throw new Error(`Remotive API returned ${res.status}`);
    const data = await res.json();
    return (data.jobs || []).map(normalizeFromRemotive);
  }

  function normalizeFromRemotive(job) {
    if (!job) job = {};
    let pubDate = null;
    if (job.publication_date) {
      pubDate = Math.floor(new Date(job.publication_date).getTime() / 1000);
    }
    const location = job.candidate_required_location
      ? job.candidate_required_location.split(',').map(s => s.trim()).filter(Boolean)
      : ['Remote'];
    return {
      title: job.title || 'Untitled',
      companyName: job.company_name || 'Unknown',
      applicationLink: job.url || null,
      pubDate: pubDate,
      expiryDate: null,
      minSalary: null,
      maxSalary: null,
      currency: null,
      locationRestrictions: location,
      description: job.description || '',
      employmentType: job.job_type ? job.job_type.replace(/_/g, ' ') : null,
      companyLogo: job.company_logo || null,
      _provider: 'remotive',
    };
  }

  /* ─── Provider: RemoteOK ──────────────────────────── */

  const REMOTEOK_API = 'https://remoteok.com/api';

  async function fetchRemoteOK(query) {
    const params = new URLSearchParams({ keyword: query });
    const res = await fetchWithTimeout(`${REMOTEOK_API}?${params}`);
    if (!res.ok) throw new Error(`RemoteOK API returned ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter(j => j && j.id && j.position)
      .map(normalizeFromRemoteOK);
  }

  function normalizeFromRemoteOK(job) {
    if (!job) job = {};
    let pubDate = null;
    if (job.date) {
      pubDate = Math.floor(new Date(job.date).getTime() / 1000);
    }
    return {
      title: job.position || 'Untitled',
      companyName: job.company || 'Unknown',
      applicationLink: job.apply_url || job.url || null,
      pubDate: pubDate,
      expiryDate: null,
      minSalary: null,
      maxSalary: null,
      currency: null,
      locationRestrictions: job.location ? [job.location] : ['Remote'],
      description: job.description || '',
      employmentType: null,
      companyLogo: job.company_logo || null,
      _provider: 'remoteok',
    };
  }

  /* ─── Provider Registry ───────────────────────────── */

  const PROVIDERS = [
    { name: 'himalayas', fetch: fetchHimalayas },
    { name: 'remotive', fetch: fetchRemotive },
    { name: 'remoteok', fetch: fetchRemoteOK },
  ];

  /* ─── Expiry / Filter / Enrich ────────────────────── */

  function isExpired(job) {
    if (!job.expiryDate) return false;
    return job.expiryDate * 1000 < Date.now();
  }

  function isTooOld(job) {
    if (!job.pubDate) return false;
    const ageDays = (Date.now() - (job.pubDate * 1000)) / (1000 * 60 * 60 * 24);
    return ageDays > MAX_JOB_AGE_DAYS;
  }

  function daysUntilExpiry(job) {
    if (!job.expiryDate) return 60;
    return Math.round(((job.expiryDate * 1000) - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function formatDate(unixTimestamp) {
    if (!unixTimestamp) return '';
    const diffDays = Math.floor((Date.now() - (unixTimestamp * 1000)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  function formatSalary(job) {
    if (!job.minSalary && !job.maxSalary) return null;
    const currency = job.currency || 'USD';
    const fmt = (val) => {
      if (!val) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency, maximumFractionDigits: 0,
      }).format(val);
    };
    if (job.minSalary && job.maxSalary) return `${fmt(job.minSalary)} - ${fmt(job.maxSalary)}`;
    if (job.minSalary) return `From ${fmt(job.minSalary)}`;
    if (job.maxSalary) return `Up to ${fmt(job.maxSalary)}`;
    return null;
  }

  function sortJobs(jobs, sortBy) {
    const sorted = [...jobs];
    switch (sortBy) {
      case 'salary':
        sorted.sort((a, b) => (b.maxSalary || b.minSalary || 0) - (a.maxSalary || a.minSalary || 0));
        break;
      case 'relevance':
        sorted.sort((a, b) => (a.expiryDate || a.pubDate || 0) - (b.expiryDate || b.pubDate || 0));
        break;
      case 'date':
      default:
        sorted.sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0));
        break;
    }
    return sorted;
  }

  function enrichJobs(jobs) {
    return jobs.map(job => {
      const expDays = daysUntilExpiry(job);
      return {
        ...job,
        _salary: formatSalary(job),
        _posted: formatDate(job.pubDate),
        _expiresIn: expDays,
        _expiryStatus: expDays <= 0 ? 'expired' : expDays <= 7 ? 'soon' : 'active',
        _snippet: (job.description || '')
          .replace(/<[^>]*>/g, '')
          .replace(/&[^;]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 250),
      };
    });
  }

  /* ─── Public Entry Point ──────────────────────────── */

  async function searchJobs(query) {
    const errors = [];
    for (const provider of PROVIDERS) {
      try {
        const raw = await provider.fetch(query);
        const active = raw.filter(j => !isExpired(j) && !isTooOld(j));
        const enriched = enrichJobs(active);
        return sortJobs(enriched, 'date');
      } catch (err) {
        console.warn(`[Search] Provider "${provider.name}" failed:`, err.message);
        errors.push(`${provider.name}: ${err.message}`);
      }
    }
    throw new Error(`All job search providers failed.\n${errors.join('\n')}`);
  }

  /* ─── Exports ─────────────────────────────────────── */

  return {
    searchJobs,
    sortJobs,
    formatDate,
    formatSalary,
    daysUntilExpiry,
    normalizeFromHimalayas,
    normalizeFromRemotive,
    normalizeFromRemoteOK,
    PROVIDERS,
  };
})();
