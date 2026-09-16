// ==========================================================================
// MangaFlow Library & Reading History View
// ==========================================================================

const LibraryView = {
  currentTab: 'bookmarks', // 'bookmarks' or 'history'

  render(tab = 'bookmarks') {
    this.currentTab = tab;
    const root = document.getElementById('app-root');
    const bookmarks = Store.getBookmarks();
    const history = Store.getHistory();

    root.innerHTML = `
      <div class="container" style="padding-top: 30px; padding-bottom: 60px;">
        
        <!-- Library Top Header -->
        <div class="library-header">
          <div>
            <h1 style="font-size: 2rem; margin-bottom: 6px;">My Manga Library</h1>
            <p class="text-muted">Track your favorite series and pick up right where you left off.</p>
          </div>

          <!-- Tab Toggles -->
          <div class="library-tabs">
            <button class="lib-tab-btn ${this.currentTab === 'bookmarks' ? 'active' : ''}" onclick="LibraryView.switchTab('bookmarks')">
              Bookmarks (${bookmarks.length})
            </button>
            <button class="lib-tab-btn ${this.currentTab === 'history' ? 'active' : ''}" onclick="LibraryView.switchTab('history')">
              History (${history.length})
            </button>
          </div>
        </div>

        <!-- Tab Body -->
        <div id="library-tab-content">
          ${this.currentTab === 'bookmarks' ? this.renderBookmarks(bookmarks) : this.renderHistory(history)}
        </div>

      </div>
    `;
  },

  switchTab(tab) {
    this.currentTab = tab;
    const btns = document.querySelectorAll('.lib-tab-btn');
    btns.forEach((b) => {
      if (b.textContent.toLowerCase().includes(tab)) b.classList.add('active');
      else b.classList.remove('active');
    });

    const content = document.getElementById('library-tab-content');
    if (content) {
      if (tab === 'bookmarks') {
        content.innerHTML = this.renderBookmarks(Store.getBookmarks());
      } else {
        content.innerHTML = this.renderHistory(Store.getHistory());
      }
    }
  },

  renderBookmarks(bookmarks) {
    if (!bookmarks || bookmarks.length === 0) {
      return `
        <div class="empty-library">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          <h3 style="font-size: 1.25rem; margin-bottom: 8px;">No bookmarked series yet</h3>
          <p class="text-muted" style="margin-bottom: 20px;">Add manga to your bookmarks while browsing to keep them here for quick access.</p>
          <a href="#/search" class="btn-glow-primary">Discover Manga</a>
        </div>
      `;
    }

    return `
      <div class="manga-grid">
        ${bookmarks.map((item) => `
          <div style="position: relative;">
            <a href="#/manga/${item.slug}" class="manga-card">
              <div class="manga-card-poster-wrap">
                <img class="manga-card-poster" src="${item.cover}" alt="${this.escapeHtml(item.name)}" loading="lazy" />
                <div class="manga-card-overlay-bottom"></div>
              </div>
              <div class="manga-card-info">
                <h3 class="manga-card-title">${this.escapeHtml(item.name)}</h3>
                <div class="manga-card-meta">
                  <span class="meta-item meta-rating">★ ${item.rating || '5.0'}</span>
                  ${item.status ? `<span class="meta-item">${item.status}</span>` : ''}
                </div>
              </div>
            </a>
            <button class="icon-btn" style="position: absolute; top: 6px; right: 6px; z-index: 10; background: rgba(0,0,0,0.7); width: 28px; height: 28px;" onclick="LibraryView.removeBookmark('${item.slug}')" title="Remove Bookmark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderHistory(history) {
    if (!history || history.length === 0) {
      return `
        <div class="empty-library">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <h3 style="font-size: 1.25rem; margin-bottom: 8px;">No reading history</h3>
          <p class="text-muted" style="margin-bottom: 20px;">Chapters you start reading will automatically appear here so you can continue seamlessly.</p>
          <a href="#/search" class="btn-glow-primary">Start Reading</a>
        </div>
      `;
    }

    return `
      <div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
        <button class="pill-btn" onclick="LibraryView.clearHistory()" style="color: #ef4444;">Clear Reading History</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${history.map((item) => `
          <div class="ranking-row">
            <div></div>
            <img class="ranking-thumb" src="${item.cover}" alt="${this.escapeHtml(item.mangaName)}" />
            <div class="ranking-details">
              <a href="#/manga/${item.mangaSlug}"><h3>${this.escapeHtml(item.mangaName)}</h3></a>
              <p class="text-xs text-muted">Last read: <strong style="color:var(--accent-light);">${this.escapeHtml(item.chapterName || 'Chapter')}</strong> • ${new Date(item.timestamp).toLocaleDateString()}</p>
            </div>
            <div>
              <a href="#/read/${item.mangaSlug}/${item.chapterSlug}" class="btn-glow-primary" style="padding: 6px 16px; font-size: 0.8rem;">
                Resume
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  removeBookmark(slug) {
    Store.removeBookmark(slug);
    App.showToast('Removed from Bookmarks');
    this.render('bookmarks');
  },

  clearHistory() {
    if (confirm('Are you sure you want to clear your reading history?')) {
      Store.clearHistory();
      App.showToast('History cleared');
      this.render('history');
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

window.LibraryView = LibraryView;
