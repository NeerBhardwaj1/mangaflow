// ==========================================================================
// MangaFlow Top Rankings View
// ==========================================================================

const RankingView = {
  currentType: 'manga',

  async render(type = 'manga') {
    this.currentType = type;
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <div class="page-loader">
        <div class="loader-spinner"></div>
        <p class="loader-text">Calculating rankings...</p>
      </div>
    `;

    try {
      const data = await API.getRanking({ type: this.currentType });
      const items = data.items || [];

      root.innerHTML = `
        <div class="container" style="padding-top: 30px; padding-bottom: 60px;">
          <div class="library-header">
            <div>
              <h1 style="font-size: 2.2rem; margin-bottom: 8px;">Top Charts & Rankings</h1>
              <p class="text-muted">The highest-rated and most-read sequential art series on MangaFlow.</p>
            </div>
          </div>

          <div class="ranking-list">
            ${items.map((item, idx) => {
              const rank = idx + 1;
              const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
              return `
                <a href="#/manga/${item.slug}" class="ranking-row">
                  <span class="ranking-number ${rankClass}" style="width: 38px; height: 38px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center;">
                    ${rank}
                  </span>
                  <img class="ranking-thumb" src="${item.cover}" alt="${this.escapeHtml(item.name)}" />
                  <div class="ranking-details">
                    <h3>${this.escapeHtml(item.name)}</h3>
                    <p class="text-xs text-muted">
                      ${item.displayViews ? `${item.displayViews} views • ` : ''}
                      ${item.displayChapters ? `${item.displayChapters} • ` : ''}
                      ★ ${item.rating || '5.0'}
                    </p>
                  </div>
                  <div>
                    <span class="btn-glow-primary" style="padding: 7px 16px; font-size: 0.8rem;">View</span>
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      root.innerHTML = `
        <div class="container" style="padding: 80px 24px; text-align: center;">
          <h2>Failed to load rankings</h2>
          <button class="btn-glow-primary" onclick="RankingView.render()" style="margin-top: 16px;">Try Again</button>
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

window.RankingView = RankingView;
