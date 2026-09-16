// ==========================================================================
// MangaFlow Genres Catalogue View
// ==========================================================================

const GenresView = {
  async render() {
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <div class="page-loader">
        <div class="loader-spinner"></div>
        <p class="loader-text">Loading genre catalogue...</p>
      </div>
    `;

    try {
      const data = await API.getGenres();
      const genres = data.genres || [];

      root.innerHTML = `
        <div class="container" style="padding-top: 30px; padding-bottom: 60px;">
          <div style="margin-bottom: 24px;">
            <h1 style="font-size: 2.2rem; margin-bottom: 8px;">Explore by Genre</h1>
            <p class="text-muted">Browse across diverse categories from Action & Adventure to Slice of Life & Romance.</p>
          </div>

          <div class="genres-grid">
            ${genres.map((g) => `
              <a href="#/search?genres=${encodeURIComponent(g.slug)}" class="genre-card">
                <div>
                  <h3 class="genre-card-name">${this.escapeHtml(g.name)}</h3>
                  <span class="text-xs text-muted">Explore titles →</span>
                </div>
                <div class="section-icon-pill">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      root.innerHTML = `
        <div class="container" style="padding: 80px 24px; text-align: center;">
          <h2>Failed to load genres</h2>
          <button class="btn-glow-primary" onclick="GenresView.render()" style="margin-top: 16px;">Try Again</button>
        </div>
      `;
    }
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

window.GenresView = GenresView;
