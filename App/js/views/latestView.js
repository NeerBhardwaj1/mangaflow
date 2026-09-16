// ==========================================================================
// MangaFlow App — Latest Updates Feed View
// ==========================================================================

const AppLatestView = {
  currentPage: 1,

  async render(page = 1) {
    this.currentPage = Number(page) || 1;
    const root = document.getElementById('app-content');
    root.innerHTML = '<div class="app-loader"><div class="app-spinner"></div></div>';

    try {
      const data = await API.getLatest(this.currentPage);
      const items = data.items || [];
      const totalPages = data.totalPages || 50;

      const cardsHtml = items.map(m => {
        const latestCh = m.latestChapter || (m.chapters && m.chapters[0]);
        const chName = latestCh ? (latestCh.name || 'Chapter') : '';
        const chSlug = latestCh ? latestCh.slug : '';

        return `
          <div class="app-card">
            <a href="#/manga/${m.slug}" class="app-card-poster-wrap">
              <img src="${API.resolveUrl(m.cover || '')}" alt="${this.escape(m.name)}" class="app-card-poster" loading="lazy" />
              <div class="app-card-gradient"></div>
              ${chName ? `<span class="app-card-ch">${this.escape(chName)}</span>` : ''}
            </a>
            <a href="#/manga/${m.slug}" class="app-card-title">${this.escape(m.name)}</a>
            <div class="app-card-meta">
              ${m.status ? `<span style="text-transform:capitalize;">${m.status}</span> • ` : ''}
              <span class="gold">★ ${m.rating || '5.0'}</span>
            </div>
          </div>
        `;
      }).join('');

      root.innerHTML = `
        <div class="app-page">
          <div class="app-section-header">
            <div>
              <span class="app-live-badge">
                <span class="app-live-dot"></span> Live Feed
              </span>
              <h1 class="app-section-title">Latest Updates</h1>
            </div>
          </div>

          <div class="app-grid">
            ${cardsHtml || '<p class="app-empty">No updates found.</p>'}
          </div>

          <div class="app-pagination">
            <button class="app-page-btn" id="latest-prev-btn" ${this.currentPage <= 1 ? 'disabled' : ''}>
              ← Prev
            </button>
            <span class="app-page-indicator">Page ${this.currentPage} of ${totalPages}</span>
            <button class="app-page-btn" id="latest-next-btn" ${this.currentPage >= totalPages ? 'disabled' : ''}>
              Next →
            </button>
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
        </div>
      `;

      document.getElementById('latest-prev-btn').onclick = () => {
        if (this.currentPage > 1) {
          window.location.hash = `#/latest?page=${this.currentPage - 1}`;
        }
      };

      document.getElementById('latest-next-btn').onclick = () => {
        if (this.currentPage < totalPages) {
          window.location.hash = `#/latest?page=${this.currentPage + 1}`;
        }
      };

      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      root.innerHTML = `
        <div class="app-empty">
          <h3>Failed to load latest updates</h3>
          <p>Please check your connection and try again.</p>
          <a href="#/" class="btn-app-primary">Return Home</a>
        </div>
      `;
    }
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
};
