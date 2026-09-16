// ==========================================================================
// MangaFlow App — Pro Library & Shelf Management View
// ==========================================================================

const AppLibraryView = {
  currentTab: 'all', // 'all' | 'reading' | 'favorites' | 'plan' | 'completed' | 'downloads' | 'history'
  viewMode: localStorage.getItem('mf_lib_view') || 'grid', // 'grid' | 'list'

  async render() {
    const root = document.getElementById('app-content');
    const bookmarks = Store.getBookmarks();
    const history = Store.getHistory();
    const downloads = window.Downloader ? await window.Downloader.getAllDownloads() : [];

    // Filter bookmarks by active shelf
    const filteredBookmarks = this.currentTab === 'all' 
      ? bookmarks 
      : bookmarks.filter(b => (b.shelf || 'reading') === this.currentTab);

    root.innerHTML = `
      <div class="app-page">
        <!-- Library Top Header -->
        <div class="app-section-header" style="margin-bottom: 12px;">
          <div>
            <h1 class="app-section-title">My Library</h1>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">
              ${bookmarks.length} saved · ${downloads.length} offline
            </p>
          </div>

          <div class="app-lib-actions">
            <!-- Layout Toggle -->
            <button class="app-icon-btn mini" id="lib-toggle-layout" title="Toggle Grid / List">
              ${this.viewMode === 'grid' ? `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              ` : `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              `}
            </button>

            <!-- Theme Picker Trigger -->
            <button class="app-icon-btn mini" id="btn-open-theme-picker" title="Change Theme">
              🎨
            </button>

            <!-- Server Settings Trigger -->
            <button class="app-icon-btn mini" id="btn-open-server-modal" title="Server Settings">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </div>

        <!-- Shelf Filter Tabs (Horizontal Scroll) -->
        <div class="app-shelf-scroll">
          <button class="app-shelf-pill ${this.currentTab === 'all' ? 'active' : ''}" data-tab="all">
            📚 All (${bookmarks.length})
          </button>
          <button class="app-shelf-pill ${this.currentTab === 'reading' ? 'active' : ''}" data-tab="reading">
            📖 Reading (${bookmarks.filter(b => (b.shelf || 'reading') === 'reading').length})
          </button>
          <button class="app-shelf-pill ${this.currentTab === 'favorites' ? 'active' : ''}" data-tab="favorites">
            ⭐ Favorites (${bookmarks.filter(b => b.shelf === 'favorites').length})
          </button>
          <button class="app-shelf-pill ${this.currentTab === 'plan' ? 'active' : ''}" data-tab="plan">
            📌 Plan (${bookmarks.filter(b => b.shelf === 'plan').length})
          </button>
          <button class="app-shelf-pill ${this.currentTab === 'completed' ? 'active' : ''}" data-tab="completed">
            ✓ Done (${bookmarks.filter(b => b.shelf === 'completed').length})
          </button>
          <button class="app-shelf-pill ${this.currentTab === 'downloads' ? 'active' : ''}" data-tab="downloads">
            💾 Offline (${downloads.length})
          </button>
          <button class="app-shelf-pill ${this.currentTab === 'history' ? 'active' : ''}" data-tab="history">
            🕒 History (${history.length})
          </button>
        </div>

        <!-- Tab Content View -->
        <div id="lib-tab-content">
          ${this.currentTab === 'downloads' 
            ? this.renderDownloads(downloads) 
            : this.currentTab === 'history'
            ? this.renderHistory(history)
            : this.renderBookmarks(filteredBookmarks)}
        </div>

        <!-- Backup & Restore Bar -->
        <div class="app-backup-card">
          <div class="app-backup-info">
            <span class="app-backup-title">Cloud & Local Backup</span>
            <small>Export or restore your saved library and reading history</small>
          </div>
          <div class="app-backup-btns">
            <button class="btn-backup-action" id="btn-export-backup">Export</button>
            <label class="btn-backup-action outline" for="backup-file-input">
              Restore
              <input type="file" id="backup-file-input" accept=".json" style="display:none;" />
            </label>
          </div>
        </div>

        <!-- Credits Area -->
        <div class="app-credits-area">
          <div class="app-credits-card">
            <div class="app-credits-badge">✨ MangaFlow</div>
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

    this.bindEvents();
  },

  renderBookmarks(bookmarks) {
    if (!bookmarks || bookmarks.length === 0) {
      return `
        <div class="app-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3>No Manga in this Shelf</h3>
          <p>Tap the bookmark button on any manga to organize it into your library.</p>
          <a href="#/search" class="btn-app-primary">Explore Manga</a>
        </div>
      `;
    }

    if (this.viewMode === 'list') {
      return `
        <div class="app-lib-list">
          ${bookmarks.map(b => {
            const history = Store.getMangaHistory(b.slug);
            const unread = Store.getUnreadCount(b.slug, b.totalChapters);
            return `
              <div class="app-lib-list-row">
                <a href="#/manga/${b.slug}" class="app-lib-list-thumb">
                  <img src="${API.resolveUrl(b.cover || '')}" alt="${this.escape(b.name)}" loading="lazy" />
                </a>
                <div class="app-lib-list-details">
                  <a href="#/manga/${b.slug}" class="app-lib-list-name">${this.escape(b.name)}</a>
                  <div class="app-lib-list-meta">
                    ${history ? `Last: ${this.escape(history.chapterName)}` : 'Not started yet'}
                  </div>
                  ${unread > 0 ? `<span class="app-unread-badge">+${unread} NEW</span>` : ''}
                </div>
                ${history ? `
                  <a href="#/read/${b.slug}/${history.chapterSlug}" class="btn-lib-resume" title="Continue reading">
                    ▶
                  </a>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // Grid View (Default)
    return `
      <div class="app-grid">
        ${bookmarks.map(b => {
          const unread = Store.getUnreadCount(b.slug, b.totalChapters);
          return `
            <a href="#/manga/${b.slug}" class="app-card">
              <div class="app-card-poster-wrap">
                <img src="${API.resolveUrl(b.cover || '')}" alt="${this.escape(b.name)}" class="app-card-poster" loading="lazy" />
                <div class="app-card-gradient"></div>
                ${unread > 0 ? `<span class="app-card-unread-badge">+${unread} NEW</span>` : ''}
              </div>
              <div class="app-card-title">${this.escape(b.name)}</div>
            </a>
          `;
        }).join('')}
      </div>
    `;
  },

  renderDownloads(downloads) {
    if (!downloads || downloads.length === 0) {
      return `
        <div class="app-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <h3>No Offline Chapters</h3>
          <p>Tap the download button on any chapter in the manga overview to read offline without internet.</p>
          <a href="#/" class="btn-app-primary">Find Manga</a>
        </div>
      `;
    }

    // Calculate total footprint
    const totalBytes = downloads.reduce((acc, cur) => acc + (cur.sizeBytes || 0), 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

    return `
      <div class="app-downloads-section">
        <div class="downloads-storage-bar">
          <span>💾 Storage Used: <strong>${totalMB} MB</strong> (${downloads.length} chapters)</span>
        </div>

        <div class="app-chapter-list">
          ${downloads.map(dl => {
            const dateStr = dl.downloadedAt ? new Date(dl.downloadedAt).toLocaleDateString() : '';
            return `
              <div class="app-chapter-row">
                <a href="#/read/${dl.mangaSlug}/${dl.chapterSlug}" class="app-chapter-link">
                  <div class="app-chapter-info">
                    <div class="app-chapter-name">${this.escape(dl.mangaName)} — ${this.escape(dl.chapterName)}</div>
                    <div class="app-chapter-meta">${dl.pageCount || 0} pages · ${dateStr}</div>
                  </div>
                  <span class="app-offline-pill">Offline Ready</span>
                </a>
                <button class="app-chapter-dl-btn downloaded" title="Delete from offline storage" onclick="AppLibraryView.deleteDownload('${dl.chapterSlug}')">
                  🗑️
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderHistory(history) {
    if (!history || history.length === 0) {
      return `
        <div class="app-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <h3>No Reading History</h3>
          <p>Chapters you read will appear here so you can easily pick up where you left off.</p>
          <a href="#/" class="btn-app-primary">Start Reading</a>
        </div>
      `;
    }

    return `
      <div>
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
          <button onclick="AppLibraryView.clearHistory()" style="font-size:0.75rem;color:var(--text-muted);background:none;border:none;padding:4px 8px;cursor:pointer;">
            Clear History
          </button>
        </div>
        <div class="app-history-list">
          ${history.map(h => {
            const timeAgo = this.formatTimeAgo(h.timestamp);
            return `
              <div class="app-history-item">
                <a href="#/manga/${h.mangaSlug}" class="app-history-thumb">
                  <img src="${API.resolveUrl(h.cover || '')}" alt="${this.escape(h.mangaName)}" loading="lazy" />
                </a>
                <div class="app-history-details">
                  <a href="#/manga/${h.mangaSlug}" class="app-history-title">${this.escape(h.mangaName)}</a>
                  <div class="app-history-chapter">${this.escape(h.chapterName)}</div>
                  <div class="app-history-time">${timeAgo}</div>
                </div>
                <a href="#/read/${h.mangaSlug}/${h.chapterSlug}" class="btn-app-resume" title="Continue reading">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </a>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  bindEvents() {
    // Shelf tab navigation
    document.querySelectorAll('.app-shelf-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.currentTab = pill.getAttribute('data-tab');
        if (window.Haptics) window.Haptics.light();
        this.render();
      });
    });

    // View mode toggle
    document.getElementById('lib-toggle-layout')?.addEventListener('click', () => {
      this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
      localStorage.setItem('mf_lib_view', this.viewMode);
      if (window.Haptics) window.Haptics.light();
      this.render();
    });

    // Theme Picker
    document.getElementById('btn-open-theme-picker')?.addEventListener('click', () => {
      if (window.ThemeManager) window.ThemeManager.openThemeModal();
    });

    // Server Modal
    document.getElementById('btn-open-server-modal')?.addEventListener('click', () => {
      if (window.openServerModal) window.openServerModal();
    });

    // Export Backup
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
      Store.exportBackup();
    });

    // Restore Backup
    document.getElementById('backup-file-input')?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const ok = Store.importBackup(event.target.result);
        if (ok) this.render();
      };
      reader.readAsText(file);
    });
  },

  async deleteDownload(chapterSlug) {
    if (!window.Downloader) return;
    const ok = confirm('Delete this chapter from offline downloads?');
    if (ok) {
      await window.Downloader.deleteChapter(chapterSlug);
      this.render();
    }
  },

  clearHistory() {
    if (confirm('Clear all reading history?')) {
      Store.clearHistory();
      this.render();
    }
  },

  formatTimeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
};

window.AppLibraryView = AppLibraryView;
