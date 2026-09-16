// ==========================================================================
// MangaFlow Search & Browse View
// ==========================================================================

const SearchView = {
  currentParams: {
    q: '',
    type: '',
    genres: '',
    status: '',
    sort: 'views_today',
    source: 'all',
    page: 1,
  },

  debounceTimer: null,

  async render(queryParams = {}) {
    const root = document.getElementById('app-root');
    
    // Parse incoming params
    this.currentParams = {
      q: queryParams.q || '',
      type: queryParams.type || '',
      genres: queryParams.genres || queryParams.genre || '',
      status: queryParams.status || '',
      sort: queryParams.sort || 'views_today',
      source: queryParams.source || 'all',
      page: parseInt(queryParams.page, 10) || 1,
    };

    root.innerHTML = `
      <div class="container" style="padding-top: 24px; padding-bottom: 60px;">
        
        <!-- Search Page Header -->
        <div class="search-page-header">
          <h1 style="font-size: 2.2rem; margin-bottom: 8px;">Explore Manga & Comics</h1>
          <p class="text-muted">Filter across 130,000+ titles by collection source, format, genre, status, and popularity.</p>
        </div>

        <!-- Filter Hub Card -->
        <div class="filter-card">
          <!-- Text Query Bar -->
          <div style="margin-bottom: 20px;">
            <div class="search-box" style="max-width: 100%; height: 48px; border-radius: var(--radius-md);">
              <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="search-input-field" placeholder="Search by title, creator, or keyword..." value="${this.escapeHtml(this.currentParams.q)}" />
              ${this.currentParams.q ? `<button id="clear-search-btn" class="icon-btn" style="width: 28px; height: 28px;" onclick="SearchView.clearQuery()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>` : ''}
            </div>
          </div>

          <!-- Collection Source Filter -->
          <div class="filter-row">
            <span class="filter-label">Collection:</span>
            <div class="filter-pills">
              <button class="pill-btn ${!this.currentParams.source || this.currentParams.source === 'all' ? 'active' : ''}" onclick="SearchView.setFilter('source', 'all')">All Comics (Unified 130K+ Library)</button>
              <button class="pill-btn ${this.currentParams.source === 'webtoons' ? 'active' : ''}" onclick="SearchView.setFilter('source', 'webtoons')">Manhwa & Webtoons Hub</button>
              <button class="pill-btn ${this.currentParams.source === 'manga' ? 'active' : ''}" onclick="SearchView.setFilter('source', 'manga')">Japanese Manga Archive (Classics & Shonen)</button>
            </div>
          </div>

          <!-- Format Filter -->
          <div class="filter-row">
            <span class="filter-label">Format:</span>
            <div class="filter-pills">
              <button class="pill-btn ${!this.currentParams.type ? 'active' : ''}" onclick="SearchView.setFilter('type', '')">All Formats</button>
              <button class="pill-btn ${this.currentParams.type === 'manhwa' ? 'active' : ''}" onclick="SearchView.setFilter('type', 'manhwa')">Korean Manhwa</button>
              <button class="pill-btn ${this.currentParams.type === 'manga' ? 'active' : ''}" onclick="SearchView.setFilter('type', 'manga')">Japanese Manga</button>
              <button class="pill-btn ${this.currentParams.type === 'manhua' ? 'active' : ''}" onclick="SearchView.setFilter('type', 'manhua')">Chinese Manhua</button>
            </div>
          </div>

          <!-- Status Filter -->
          <div class="filter-row">
            <span class="filter-label">Status:</span>
            <div class="filter-pills">
              <button class="pill-btn ${!this.currentParams.status ? 'active' : ''}" onclick="SearchView.setFilter('status', '')">All</button>
              <button class="pill-btn ${this.currentParams.status === 'ongoing' ? 'active' : ''}" onclick="SearchView.setFilter('status', 'ongoing')">Ongoing</button>
              <button class="pill-btn ${this.currentParams.status === 'completed' ? 'active' : ''}" onclick="SearchView.setFilter('status', 'completed')">Completed</button>
            </div>
          </div>

          <!-- Sort Filter -->
          <div class="filter-row">
            <span class="filter-label">Sort:</span>
            <div class="filter-pills">
              <button class="pill-btn ${this.currentParams.sort === 'views_today' ? 'active' : ''}" onclick="SearchView.setFilter('sort', 'views_today')">Most Popular Today</button>
              <button class="pill-btn ${this.currentParams.sort === 'newest' ? 'active' : ''}" onclick="SearchView.setFilter('sort', 'newest')">Newest Series</button>
              <button class="pill-btn ${this.currentParams.sort === 'updated' ? 'active' : ''}" onclick="SearchView.setFilter('sort', 'updated')">Latest Updated</button>
            </div>
          </div>

          <!-- Popular Genres -->
          <div class="filter-row">
            <span class="filter-label">Genre:</span>
            <div class="filter-pills">
              <button class="pill-btn ${!this.currentParams.genres ? 'active' : ''}" onclick="SearchView.setFilter('genres', '')">All Genres</button>
              ${['action', 'romance', 'fantasy', 'comedy', 'supernatural', 'isekai', 'drama', 'sci-fi', 'mystery', 'horror'].map(g => `
                <button class="pill-btn ${this.currentParams.genres === g ? 'active' : ''}" onclick="SearchView.setFilter('genres', '${g}')">${g.charAt(0).toUpperCase() + g.slice(1)}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Results Grid Container -->
        <div id="search-results-container">
          <div class="page-loader">
            <div class="loader-spinner"></div>
            <p class="loader-text">Finding matching manga...</p>
          </div>
        </div>

      </div>
    `;

    this.bindSearchInput();
    this.executeSearch();
  },

  bindSearchInput() {
    const input = document.getElementById('search-input-field');
    if (!input) return;

    input.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.currentParams.q = e.target.value.trim();
        this.currentParams.page = 1;
        this.executeSearch();
      }, 350);
    });
  },

  clearQuery() {
    this.currentParams.q = '';
    this.currentParams.page = 1;
    const input = document.getElementById('search-input-field');
    if (input) input.value = '';
    this.executeSearch();
  },

  setFilter(key, value) {
    this.currentParams[key] = value;
    this.currentParams.page = 1;
    this.executeSearch();
  },

  async executeSearch() {
    const resultsContainer = document.getElementById('search-results-container');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div class="page-loader" style="min-height: 300px;">
        <div class="loader-spinner"></div>
      </div>
    `;

    try {
      const data = await API.search(this.currentParams);
      const items = data.items || [];
      const pagination = data.pagination || { page: 1, total_pages: 1, total: 0 };
      const hasQuery = this.currentParams.q && this.currentParams.q.trim().length > 0;

      if (items.length === 0) {
        resultsContainer.innerHTML = `
          <div class="empty-library">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <h3 style="font-size: 1.25rem; margin-bottom: 8px;">No titles found</h3>
            <p class="text-muted">Try adjusting your keywords or clearing selected filters.</p>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = `
        <div style="margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
          <p class="text-sm text-muted">Showing <strong>${items.length}</strong> results (Total: ${pagination.total || items.length})</p>
        </div>

        <div class="manga-grid">
          ${items.map((item, idx) => this.renderSearchCard(item, idx, hasQuery)).join('')}
        </div>

        <!-- Pagination Bar -->
        <div class="pagination-container">
          <button class="page-btn" ${pagination.page <= 1 ? 'disabled' : ''} onclick="SearchView.changePage(${pagination.page - 1})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Previous
          </button>
          <span class="page-indicator">Page ${pagination.page} of ${pagination.total_pages || 1}</span>
          <button class="page-btn" ${pagination.page >= (pagination.total_pages || 1) ? 'disabled' : ''} onclick="SearchView.changePage(${pagination.page + 1})">
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      `;
    } catch (err) {
      resultsContainer.innerHTML = `
        <div class="empty-library">
          <p class="text-muted">Failed to load search results. Please try again.</p>
        </div>
      `;
    }
  },

  renderSearchCard(item, index, hasQuery) {
    const latestChap = item.latestChapters?.[0]?.name || (item.displayChapters ? item.displayChapters : '');
    const showBestMatch = hasQuery && index === 0;

    return `
      <a href="#/manga/${item.slug}" class="manga-card">
        <div class="manga-card-poster-wrap">
          ${showBestMatch ? '<span class="badge-best-match">★ Best Match</span>' : ''}
          ${item.isHot && !showBestMatch ? '<div class="card-badge-top-right"><span class="badge-hot">HOT</span></div>' : ''}
          <img class="manga-card-poster" src="${item.cover}" alt="${this.escapeHtml(item.name)}" loading="lazy" />
          <div class="manga-card-overlay-bottom"></div>
          ${latestChap ? `<span class="badge-chapter-bottom">${this.escapeHtml(latestChap)}</span>` : ''}
        </div>
        <div class="manga-card-info">
          <h3 class="manga-card-title">${this.escapeHtml(item.name)}</h3>
          <div class="manga-card-meta">
            <span class="meta-item meta-rating">★ ${item.rating || '5.0'}</span>
            ${item.displayUpdatedShort ? `<span class="meta-item">${item.displayUpdatedShort}</span>` : ''}
          </div>
        </div>
      </a>
    `;
  },

  changePage(newPage) {
    this.currentParams.page = newPage;
    window.scrollTo({ top: 200, behavior: 'smooth' });
    this.executeSearch();
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
};

window.SearchView = SearchView;
