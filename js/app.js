/**
 * app.js — Main application orchestrator.
 * Manages UI state, file handling, keyword extraction, job search, and rendering.
 * Everything runs in the browser — zero server storage.
 */

(function () {
  'use strict';

  /* ─── DOM References ────────────────────────────── */
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileHint = document.getElementById('fileHint');

  const keywordsSection = document.getElementById('keywordsSection');
  const keywordsTags = document.getElementById('keywordsTags');
  const keywordsCount = document.getElementById('keywordsCount');
  const searchBtn = document.getElementById('searchBtn');

  const loadingSection = document.getElementById('loadingSection');
  const loadingText = document.getElementById('loadingText');

  const resultsSection = document.getElementById('resultsSection');
  const resultsGrid = document.getElementById('resultsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const sortSelect = document.getElementById('sortSelect');

  const emptySection = document.getElementById('emptySection');
  const emptyMessage = document.getElementById('emptyMessage');

  const errorSection = document.getElementById('errorSection');
  const errorMessage = document.getElementById('errorMessage');
  const retryBtn = document.getElementById('retryBtn');

  /* ─── Application State ────────────────────────── */
  const state = {
    resumeText: null,       // Raw text extracted from resume
    extractedKeywords: null, // Result from Extractor
    jobs: [],               // Current active job list
    isSearching: false,
    currentQuery: null
  };

  /* ─── Show / Hide Helpers ──────────────────────── */
  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }

  function resetAll() {
    hide(keywordsSection);
    hide(loadingSection);
    hide(resultsSection);
    hide(emptySection);
    hide(errorSection);
  }

  /* ─── File Handling ─────────────────────────────── */
  function handleFile(file) {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.docx')) {
      fileHint.textContent = 'Please select a PDF or DOCX file.';
      return;
    }

    fileHint.textContent = `Reading: ${file.name}`;
    dropZone.classList.add('has-file');

    // Hide previous results while parsing
    resetAll();

    // Parse the resume in the browser
    Parser.parseResume(file)
      .then(text => {
        if (!text || text.length < 20) {
          fileHint.textContent = 'Could not extract enough text. Try a different file.';
          return;
        }

        state.resumeText = text;
        fileHint.textContent = `Parsed successfully (${text.length} characters)`;

        // Extract keywords from the resume text
        state.extractedKeywords = Extractor.extractKeywords(text);
        showKeywords(state.extractedKeywords);
      })
      .catch(err => {
        console.error('Parse error:', err);
        fileHint.textContent = 'Error reading file. Please try again.';
        dropZone.classList.remove('has-file');
      });
  }

  /* ─── Display Extracted Keywords ────────────────── */
  function showKeywords(result) {
    const keywords = result.summary || [];

    if (keywords.length === 0) {
      fileHint.textContent = 'No recognizable skills found. Try a more detailed resume.';
      return;
    }

    // Render keyword tags
    keywordsTags.innerHTML = keywords.map(kw =>
      `<span>${escapeHtml(kw)}</span>`
    ).join('');

    keywordsCount.textContent = `${keywords.length} keywords`;
    show(keywordsSection);
  }

  /* ─── Search for Jobs ────────────────────────────── */
  async function performSearch() {
    if (state.isSearching) return;
    if (!state.extractedKeywords || state.extractedKeywords.all.length === 0) {
      return;
    }

    state.isSearching = true;
    const query = state.extractedKeywords.searchQuery;
    state.currentQuery = query;

    // Show loading state
    hide(keywordsSection);
    hide(resultsSection);
    hide(emptySection);
    hide(errorSection);
    loadingText.textContent = `Searching jobs for: "${query}"…`;
    show(loadingSection);

    try {
      // Call Himalayas API via our Search module
      const jobs = await Search.searchJobs(query);

      state.jobs = jobs;
      state.isSearching = false;
      hide(loadingSection);

      if (jobs.length === 0) {
        emptyMessage.textContent = 'No active job listings found matching your resume. Try uploading a more detailed resume or different file.';
        show(emptySection);
      } else {
        renderResults(jobs);
        show(resultsSection);
      }

    } catch (err) {
      console.error('Search error:', err);
      state.isSearching = false;
      hide(loadingSection);
      errorMessage.textContent = `Could not reach the job search service: ${err.message}`;
      show(errorSection);
    }
  }

  /* ─── Render Job Cards ───────────────────────────── */
  function renderResults(jobs, sortBy) {
    // Apply sorting if specified
    const sorted = sortBy ? Search.sortJobs(jobs, sortBy) : jobs;

    resultsCount.textContent = sorted.length;

    resultsGrid.innerHTML = sorted.map(job => {
      // Build location string
      const location = (job.locationRestrictions && job.locationRestrictions.length > 0)
        ? job.locationRestrictions.join(', ')
        : 'Remote';

      // Badge for expiry status
      let badgeClass = 'job-card__expiry-badge--active';
      let badgeText = 'Active';
      if (job._expiryStatus === 'soon') {
        badgeClass = 'job-card__expiry-badge--soon';
        badgeText = `${job._expiresIn}d left`;
      } else if (job._expiryStatus === 'expired') {
        badgeClass = 'job-card__expiry-badge--expired';
        badgeText = 'Expired';
      }

      // Company initial for logo fallback
      const companyInitial = (job.companyName || '?').charAt(0).toUpperCase();

      return `
        <div class="job-card">
          <div class="job-card__header">
            <div class="job-card__info">
              <div class="job-card__title">${escapeHtml(job.title || 'Untitled')}</div>
              <div class="job-card__company">${escapeHtml(job.companyName || 'Unknown Company')}</div>
            </div>
            <div class="job-card__logo">
              ${job.companyLogo ? `<img src="${escapeHtml(job.companyLogo)}" alt="${escapeHtml(job.companyName)}" loading="lazy">` : companyInitial}
            </div>
          </div>

          <div class="job-card__meta">
            <span class="job-card__meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              ${job.employmentType || 'N/A'}
            </span>
            <span class="job-card__meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${escapeHtml(location)}
            </span>
            ${job._salary ? `
            <span class="job-card__meta-item job-card__salary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              ${escapeHtml(job._salary)}
            </span>` : ''}
            <span class="job-card__expiry-badge ${badgeClass}">${badgeText}</span>
          </div>

          <div class="job-card__snippet">${escapeHtml(job._snippet || 'No description available.')}</div>

          <div class="job-card__footer">
            <span class="job-card__date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Posted ${job._posted || 'recently'}
            </span>
            <a href="${escapeHtml(job.applicationLink || '#')}" target="_blank" rel="noopener noreferrer" class="job-card__apply">
              Apply Now
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ─── Simple HTML Escaping ───────────────────────── */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ─── Event Listeners ───────────────────────────── */

  // File input change
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFile(fileInput.files[0]);
    }
  });

  // Drag and drop events
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
      // Sync the file input for accessibility
      const dt = new DataTransfer();
      dt.items.add(e.dataTransfer.files[0]);
      fileInput.files = dt.files;
    }
  });

  // Search button
  searchBtn.addEventListener('click', performSearch);

  // Retry button (error state)
  retryBtn.addEventListener('click', () => {
    hide(errorSection);
    show(keywordsSection);
  });

  // Sort selector
  sortSelect.addEventListener('change', () => {
    if (state.jobs.length > 0) {
      renderResults(state.jobs, sortSelect.value);
    }
  });

  // Also allow search via Enter key from anywhere (convenience)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !keywordsSection.hidden) {
      performSearch();
    }
  });

  console.log('JobGenie ready. Upload your resume to get started.');
})();
