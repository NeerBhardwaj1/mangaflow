// ==========================================================================
// MangaFlow Latest Updates Feed View
// ==========================================================================

const LatestView = {
  currentPage: 1,

  async render(page = 1) {
    this.currentPage = parseInt(page, 10) || 1;
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <div class="page-loader">
        <div class="loader-spinner"></div>
        <p class="loader-text">Fetching latest manga updates...</p>
      </div>
    `;

    try {
      const data = await API.getLatest({ page: this.currentPage });
      const items = data.items || [];
      const pagination = data.pagination || { page: this.currentPage, total_pages: 100, total: 1000 };

      root.innerHTML = `
        <div class="container" style="padding-top: 24px; padding-bottom: 60px;">
          
          <!-- Header Banner -->
          <div class="search-page-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-full); color: var(--accent-emerald); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--accent-emerald); box-shadow: 0 0 8px var(--accent-emerald);"></span>
                Live Updates Feed
              </div>
              <h1 style="font-size: 2.2rem; margin-bottom: 6px;">Latest Manga Chapters</h1>
              <p class="text-muted">Freshly translated chapters added today. 100% free with no login required.</p>
            </div>

            <div style="display: flex; gap: 8px;">
              <a href="#/search?sort=views_today" class="pill-btn">Trending</a>
              <a href="#/search?type=manhwa" class="pill-btn">Manhwa</a>
              <a href="#/search?type=manga" class="pill-btn">Manga</a>
            </div>
          </div>

          <!-- Updates Grid -->
          <div class="manga-grid" style="margin-top: 24px;">
            ${items.map((item) => this.renderLatestCard(item)).join('')}
          </div>

          <!-- Pagination -->
          <div class="pagination-container">
            <button class="page-btn" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="LatestView.changePage(${this.currentPage - 1})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Previous
            </button>
            <span class="page-indicator">Page ${this.currentPage} of ${pagination.total_pages || 50}</span>
            <button class="page-btn" ${this.currentPage >= (pagination.total_pages || 50) ? 'disabled' : ''} onclick="LatestView.changePage(${this.currentPage + 1})">
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

        </div>
      `;
    } catch (err) {
      root.innerHTML = `
        <div class="container" style="padding: 80px 24px; text-align: center;">
          <h2>Failed to load updates</h2>
          <p class="text-muted" style="margin-top: 8px;">Unable to reach the live feed. Please retry.</p>
          <button class="btn-glow-primary" onclick="LatestView.render(1)" style="margin-top: 16px;">Retry</button>
        </div>
      `;
    }
  },

  renderLatestCard(item) {
    const latestChapter = item.latestChapters?.[0];
    const chapterName = latestChapter ? latestChapter.name : (item.displayChapters || 'New Chapter');
    const readUrl = latestChapter ? `#/read/${item.slug}/${latestChapter.slug}` : `#/manga/${item.slug}`;

    return `
      <div class="manga-card">
        <div class="manga-card-poster-wrap">
          <a href="#/manga/${item.slug}" aria-label="${this.escapeHtml(item.name)}">
            <img class="manga-card-poster" src="${item.cover}" alt="${this.escapeHtml(item.name)}" loading="lazy" />
          </a>
          <div class="manga-card-overlay-bottom"></div>
          
          <!-- Direct Quick-Read Chapter Link -->
          <a href="${readUrl}" class="badge-chapter-bottom" style="text-decoration: none; display: flex; align-items: center; gap: 4px;" title="Read ${this.escapeHtml(chapterName)}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>${this.escapeHtml(chapterName)}</span>
          </a>
        </div>
        <div class="manga-card-info">
          <a href="#/manga/${item.slug}">
            <h3 class="manga-card-title">${this.escapeHtml(item.name)}</h3>
          </a>
          <div class="manga-card-meta">
            <span class="meta-item">${item.displayUpdatedShort || 'Just now'}</span>
            ${item.displayViews ? `<span class="meta-item">• ${item.displayViews} views</span>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  changePage(newPage) {
    window.location.hash = `#/latest?page=${newPage}`;
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

window.LatestView = LatestView;
