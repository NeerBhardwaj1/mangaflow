// ==========================================================================
// MangaFlow App — Advanced Search & Multi-Genre Browse View
// ==========================================================================

const AppSearchView = {
  params: { q: '', type: '', sort: 'views_today', genres: '', status: '', page: 1 },
  timer: null,

  GENRES: [
    { slug: 'action', name: 'Action' },
    { slug: 'adventure', name: 'Adventure' },
    { slug: 'comedy', name: 'Comedy' },
    { slug: 'drama', name: 'Drama' },
    { slug: 'fantasy', name: 'Fantasy' },
    { slug: 'isekai', name: 'Isekai' },
    { slug: 'martial-arts', name: 'Martial Arts' },
    { slug: 'mystery', name: 'Mystery' },
    { slug: 'romance', name: 'Romance' },
    { slug: 'sci-fi', name: 'Sci-Fi' },
    { slug: 'shounen', name: 'Shounen' },
    { slug: 'slice-of-life', name: 'Slice of Life' },
    { slug: 'supernatural', name: 'Supernatural' },
    { slug: 'thriller', name: 'Thriller' }
  ],

  async render(qp = {}) {
    this.params = {
      q: qp.q || '',
      type: qp.type || '',
      sort: qp.sort || 'views_today',
      genres: qp.genres || qp.genre || '',
      status: qp.status || '',
      page: parseInt(qp.page) || 1
    };

    const root = document.getElementById('app-content');
    const selectedGenres = this.params.genres ? this.params.genres.split(',').filter(Boolean) : [];

    root.innerHTML = `
      <div class="app-page">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;">
          <div>
            <h1 class="app-section-title">Browse & Filter</h1>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">130,000+ manga, manhwa & comics</p>
          </div>
          <!-- Filter Sheet Trigger Button -->
          <button class="app-icon-btn mini ${selectedGenres.length > 0 || this.params.status ? 'active-filter' : ''}" id="btn-open-filter-modal" title="Advanced Filters">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            ${selectedGenres.length > 0 ? `<span class="filter-count-badge">${selectedGenres.length}</span>` : ''}
          </button>
        </div>

        <!-- Search Bar -->
        <div style="display:flex;gap:8px;align-items:center;background:var(--bg-card);padding:10px 14px;border-radius:var(--radius-md);border:1px solid var(--border-subtle);margin-bottom:12px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="browse-input" placeholder="Search by title, author, keyword..." value="${this.escape(this.params.q)}" style="flex:1;background:none;border:none;outline:none;color:var(--text-primary);font-size:0.88rem;font-family:inherit;" />
          ${this.params.q ? `<button onclick="AppSearchView.clearQuery()" style="background:none;border:none;color:var(--text-muted);font-size:0.9rem;cursor:pointer;">✕</button>` : ''}
        </div>

        <!-- Quick Filter Pills -->
        <div class="app-shelf-scroll" style="margin-bottom:14px;">
          <button class="app-shelf-pill ${!this.params.type ? 'active' : ''}" onclick="AppSearchView.setFilter('type','')">All</button>
          <button class="app-shelf-pill ${this.params.type === 'manhwa' ? 'active' : ''}" onclick="AppSearchView.setFilter('type','manhwa')">Manhwa</button>
          <button class="app-shelf-pill ${this.params.type === 'manga' ? 'active' : ''}" onclick="AppSearchView.setFilter('type','manga')">Manga</button>
          <button class="app-shelf-pill ${this.params.type === 'manhua' ? 'active' : ''}" onclick="AppSearchView.setFilter('type','manhua')">Manhua</button>
          <button class="app-shelf-pill ${this.params.sort === 'views_today' ? 'active' : ''}" onclick="AppSearchView.setFilter('sort','views_today')">🔥 Popular</button>
          <button class="app-shelf-pill ${this.params.sort === 'rating' ? 'active' : ''}" onclick="AppSearchView.setFilter('sort','rating')">★ Top Rated</button>
          <button class="app-shelf-pill ${this.params.sort === 'updated' ? 'active' : ''}" onclick="AppSearchView.setFilter('sort','updated')">⚡ Updated</button>
        </div>

        <!-- Active Filter Tags Display -->
        ${selectedGenres.length > 0 ? `
          <div class="active-filters-row">
            <span style="font-size:0.7rem;color:var(--text-muted);">Genres:</span>
            ${selectedGenres.map(g => `
              <span class="active-filter-tag">
                ${g}
                <button onclick="AppSearchView.removeGenre('${g}')">✕</button>
              </span>
            `).join('')}
            <button class="btn-clear-all-filters" onclick="AppSearchView.clearAllFilters()">Clear All</button>
          </div>
        ` : ''}

        <div id="browse-results"><div class="app-loader"><div class="app-spinner"></div></div></div>

        <!-- Advanced Filter Modal Sheet -->
        <div id="advanced-filter-modal" class="app-modal-backdrop" style="display:none;">
          <div class="app-modal-sheet">
            <div class="modal-drag-pill"></div>
            <div class="modal-header">
              <h3>🎯 Advanced Filters</h3>
              <button class="modal-close-btn" id="filter-modal-close">✕</button>
            </div>

            <!-- Sort By -->
            <div class="reader-pref-group">
              <label>Sort By</label>
              <div class="reader-mode-tabs">
                <button class="reader-mode-tab ${this.params.sort === 'views_today' ? 'active' : ''}" data-filter-sort="views_today">Most Viewed</button>
                <button class="reader-mode-tab ${this.params.sort === 'rating' ? 'active' : ''}" data-filter-sort="rating">Top Rated</button>
                <button class="reader-mode-tab ${this.params.sort === 'updated' ? 'active' : ''}" data-filter-sort="updated">Recently Updated</button>
                <button class="reader-mode-tab ${this.params.sort === 'newest' ? 'active' : ''}" data-filter-sort="newest">Newest</button>
              </div>
            </div>

            <!-- Status -->
            <div class="reader-pref-group">
              <label>Publication Status</label>
              <div class="reader-mode-tabs">
                <button class="reader-mode-tab ${!this.params.status ? 'active' : ''}" data-filter-status="">Any</button>
                <button class="reader-mode-tab ${this.params.status === 'ongoing' ? 'active' : ''}" data-filter-status="ongoing">Ongoing</button>
                <button class="reader-mode-tab ${this.params.status === 'completed' ? 'active' : ''}" data-filter-status="completed">Completed</button>
              </div>
            </div>

            <!-- Multi-Select Genres -->
            <div class="reader-pref-group">
              <label>Genres (Select multiple)</label>
              <div class="filter-genres-grid">
                ${this.GENRES.map(g => {
                  const isSel = selectedGenres.includes(g.slug);
                  return `
                    <button class="filter-genre-tag ${isSel ? 'selected' : ''}" data-genre-slug="${g.slug}">
                      ${g.name}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Modal Action Buttons -->
            <div style="display:flex;gap:10px;margin-top:16px;">
              <button class="btn-app-secondary" id="btn-reset-filters" style="flex:1;">Reset</button>
              <button class="btn-app-primary" id="btn-apply-filters" style="flex:2;">Apply Filters</button>
            </div>

          </div>
        </div>

      </div>
    `;

    this.bindEvents();
    this.load();
  },

  bindEvents() {
    // Instant input debounce
    const input = document.getElementById('browse-input');
    input?.addEventListener('input', e => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.params.q = e.target.value.trim();
        this.params.page = 1;
        this.load();
      }, 300);
    });

    // Filter Modal Sheet Open/Close
    const filterModal = document.getElementById('advanced-filter-modal');
    const openBtn = document.getElementById('btn-open-filter-modal');
    const closeBtn = document.getElementById('filter-modal-close');

    openBtn?.addEventListener('click', () => {
      filterModal.style.display = 'flex';
      if (window.Haptics) window.Haptics.light();
    });

    closeBtn?.addEventListener('click', () => {
      filterModal.style.display = 'none';
    });

    filterModal?.addEventListener('click', (e) => {
      if (e.target === filterModal) filterModal.style.display = 'none';
    });

    // Modal Genre Tag Clicks (toggle)
    filterModal?.querySelectorAll('.filter-genre-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        tag.classList.toggle('selected');
        if (window.Haptics) window.Haptics.light();
      });
    });

    // Modal Sort Clicks
    filterModal?.querySelectorAll('[data-filter-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        filterModal.querySelectorAll('[data-filter-sort]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.Haptics) window.Haptics.light();
      });
    });

    // Modal Status Clicks
    filterModal?.querySelectorAll('[data-filter-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        filterModal.querySelectorAll('[data-filter-status]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.Haptics) window.Haptics.light();
      });
    });

    // Apply Filters
    document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
      const activeSort = filterModal.querySelector('[data-filter-sort].active')?.getAttribute('data-filter-sort') || 'views_today';
      const activeStatus = filterModal.querySelector('[data-filter-status].active')?.getAttribute('data-filter-status') || '';
      const activeGenres = Array.from(filterModal.querySelectorAll('.filter-genre-tag.selected')).map(t => t.getAttribute('data-genre-slug'));

      this.params.sort = activeSort;
      this.params.status = activeStatus;
      this.params.genres = activeGenres.join(',');
      this.params.page = 1;

      filterModal.style.display = 'none';
      if (window.Haptics) window.Haptics.medium();
      this.render(this.params);
    });

    // Reset Filters
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      filterModal.querySelectorAll('.filter-genre-tag').forEach(t => t.classList.remove('selected'));
      filterModal.querySelectorAll('[data-filter-status]').forEach(b => b.classList.toggle('active', !b.getAttribute('data-filter-status')));
      filterModal.querySelectorAll('[data-filter-sort]').forEach(b => b.classList.toggle('active', b.getAttribute('data-filter-sort') === 'views_today'));
      if (window.Haptics) window.Haptics.light();
    });
  },

  setFilter(key, val) {
    this.params[key] = val;
    this.params.page = 1;
    if (window.Haptics) window.Haptics.light();
    this.render(this.params);
  },

  clearQuery() {
    this.params.q = '';
    this.params.page = 1;
    this.render(this.params);
  },

  removeGenre(genreSlug) {
    const list = this.params.genres.split(',').filter(g => g && g !== genreSlug);
    this.params.genres = list.join(',');
    this.params.page = 1;
    this.render(this.params);
  },

  clearAllFilters() {
    this.params.genres = '';
    this.params.status = '';
    this.params.type = '';
    this.params.page = 1;
    this.render(this.params);
  },

  async load() {
    const container = document.getElementById('browse-results');
    if (!container) return;
    container.innerHTML = '<div class="app-loader" style="min-height:200px"><div class="app-spinner"></div></div>';

    try {
      const data = await API.search(this.params);
      const items = data.items || [];
      const pg = data.pagination || { page: 1, total_pages: 1 };
      const hasQ = this.params.q && this.params.q.length > 0;

      if (!items.length) {
        container.innerHTML = `
          <div class="app-empty">
            <h3>No Results Found</h3>
            <p>Try adjusting your keywords or clearing some genre filters.</p>
            <button class="btn-app-primary" onclick="AppSearchView.clearAllFilters()">Clear Filters</button>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:12px;">
          ${items.length} titles found · Page ${pg.page} of ${pg.total_pages || 1}
        </p>
        <div class="app-grid">
          ${items.map((m, i) => {
            const ch = m.latestChapters?.[0]?.name || m.displayChapters || '';
            const isBest = hasQ && i === 0;
            return `
              <a href="#/manga/${m.slug}" class="app-card">
                <div class="app-card-poster-wrap">
                  ${isBest ? '<span class="app-card-match-badge">★ BEST MATCH</span>' : ''}
                  <img class="app-card-poster" src="${API.resolveUrl(m.cover)}" alt="${this.escape(m.name)}" loading="lazy" />
                  <div class="app-card-gradient"></div>
                  ${ch ? `<span class="app-card-ch">${this.escape(ch)}</span>` : ''}
                </div>
                <div class="app-card-title">${this.escape(m.name)}</div>
                <div class="app-card-meta"><span class="gold">★ ${m.rating || '5.0'}</span></div>
              </a>
            `;
          }).join('')}
        </div>
        <div class="app-pagination">
          <button class="app-page-btn" ${pg.page <= 1 ? 'disabled' : ''} onclick="AppSearchView.goPage(${pg.page - 1})">← Prev</button>
          <span class="app-page-indicator">${pg.page} / ${pg.total_pages || 1}</span>
          <button class="app-page-btn" ${pg.page >= (pg.total_pages || 1) ? 'disabled' : ''} onclick="AppSearchView.goPage(${pg.page + 1})">Next →</button>
        </div>

        <!-- Credits Footer -->
        <div class="app-credits-area" style="margin-top: 28px;">
          <div class="app-credits-card">
            <div class="app-credits-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Credits
            </div>
            <div class="app-credits-content">
              <span>Made with love by</span>
              <span class="app-credits-author">Neer Chan</span>
              <span class="app-credits-heart">❤</span>
            </div>
            <p class="app-credits-sub">Enjoy reading manga, manhwa & comics on MangaFlow</p>
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = '<div class="app-empty"><p>Failed to load results</p></div>';
    }
  },

  goPage(n) {
    this.params.page = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.load();
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
};

window.AppSearchView = AppSearchView;
