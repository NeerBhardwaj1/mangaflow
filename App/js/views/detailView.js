// ==========================================================================
// MangaFlow App — Detail View with Downloads & Recommendations
// ==========================================================================

const AppDetailView = {
  currentManga: null,
  chaptersList: [],
  isSortAsc: false,
  chapterFilterQuery: '',

  async render(slug) {
    const root = document.getElementById('app-content');
    root.innerHTML = '<div class="app-loader"><div class="app-spinner"></div></div>';

    try {
      const manga = await API.getManga(slug);
      this.currentManga = manga;
      this.chaptersList = manga.chapters || [];
      this.isSortAsc = false;
      this.chapterFilterQuery = '';

      // Update total chapters in store for unread tracking
      Store.updateMangaChapterCount(manga.slug, this.chaptersList.length);

      const bookmark = Store.getBookmark(manga.slug);
      const isSaved = !!bookmark;
      const currentShelf = bookmark?.shelf || 'reading';
      const history = Store.getMangaHistory(manga.slug);

      // Always find the ACTUAL first chapter (Chapter 0/prologue, Chapter 1, or lowest chapter)
      let firstChapter = null;
      if (manga.firstChapter && manga.firstChapter.slug) {
        firstChapter = manga.firstChapter;
      } else if (this.chaptersList.length > 0) {
        firstChapter = this.findFirstChapter(this.chaptersList);
      }

      const genresHtml = (manga.genres || []).map(g => {
        const name = typeof g === 'object' ? g.name : g;
        const s = typeof g === 'object' ? g.slug : g;
        return `<a href="#/search?genre=${encodeURIComponent(s)}" class="app-genre-pill">${name}</a>`;
      }).join('');

      // Build initial chapters HTML
      const sortedChapters = this.getFilteredChapters();
      const chaptersHtml = this.renderChaptersHtml(sortedChapters, manga, history);

      root.innerHTML = `
        <div class="app-detail-backdrop" style="background-image: url('${API.resolveUrl(manga.cover || '')}');"></div>
        <div class="app-page app-detail-content">
          <div class="app-detail-top">
            <img src="${API.resolveUrl(manga.cover || '')}" alt="${this.escape(manga.name)}" class="app-detail-poster" />
            <div class="app-detail-info">
              ${manga.status ? `<span class="app-detail-status ${manga.status.toLowerCase()}">${manga.status}</span>` : ''}
              <h1 class="app-detail-title">${this.escape(manga.name)}</h1>
              ${manga.authors && manga.authors.length ? `<div class="app-detail-author">${manga.authors.map(a => a.name || a).join(', ')}</div>` : ''}
              
              <!-- Credits Pill -->
              <div class="app-detail-credits-pill">
                <span class="app-credits-heart">❤</span> Made with love by <strong>Neer Chan</strong>
              </div>
              
              <div class="app-detail-stats">
                <div class="app-detail-stat">
                  <b>★ ${manga.rating || '5.0'}</b>
                  Rating
                </div>
                <div class="app-detail-stat">
                  <b>${manga.chapters ? manga.chapters.length : 0}</b>
                  Chapters
                </div>
                <div class="app-detail-stat">
                  <b>${manga.displayViews || '10K+'}</b>
                  Views
                </div>
              </div>
            </div>
          </div>

          <div class="app-detail-actions">
            ${history ? `
              <a href="#/read/${manga.slug}/${history.chapterSlug}" class="btn-app-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Resume ${this.escape(this.cleanChapterName(history.chapterName || 'Chapter'))}
              </a>
            ` : firstChapter ? `
              <a href="#/read/${manga.slug}/${firstChapter.slug}" class="btn-app-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Start Reading
              </a>
            ` : ''}

            <!-- Shelf / Bookmark Action -->
            <button id="app-bookmark-btn" class="app-detail-bookmark ${isSaved ? 'active' : ''}" onclick="AppDetailView.openShelfPicker()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
          </div>

          ${genresHtml ? `<div class="app-detail-genres">${genresHtml}</div>` : ''}

          ${manga.synopsis ? `
            <div class="app-detail-synopsis" id="app-synopsis">${this.escape(manga.synopsis)}</div>
          ` : ''}

          <!-- Chapters List -->
          <div class="app-section">
            <div class="app-detail-chapters-header">
              <div class="app-detail-chapters-title-row">
                <h2 class="app-section-title">Chapters (<span id="app-chapter-count-badge">${this.chaptersList.length}</span>)</h2>
              </div>
              <div class="app-chapters-controls">
                <div class="app-chapter-search-box">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" id="app-chapter-filter-input" placeholder="Search chapters..." oninput="AppDetailView.onFilterChapters(this.value)" autocomplete="off" />
                  <button id="app-chapter-search-clear" class="app-search-clear-btn" style="display:none;" onclick="AppDetailView.clearChapterFilter()">✕</button>
                </div>
                <button class="app-btn-sort-chapters" id="app-btn-sort" onclick="AppDetailView.toggleChapterSort()" title="Toggle Sort Order">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                  <span id="app-sort-order-label">${this.isSortAsc ? 'Oldest First' : 'Newest First'}</span>
                </button>
              </div>
            </div>
            <div class="app-chapter-list" id="app-chapter-list-container">
              ${chaptersHtml || '<p class="app-empty">No chapters available</p>'}
            </div>
          </div>

          <!-- Recommendations Carousel -->
          <div class="app-section" id="recommended-section" style="display:none;">
            <div class="app-detail-chapters-header">
              <h2 class="app-section-title">✨ You May Also Like</h2>
            </div>
            <div class="app-rail" id="recommended-rail"></div>
          </div>

          <!-- Credits Area -->
          <div class="app-credits-area">
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

        <!-- Shelf Picker Bottom Sheet Modal -->
        <div id="shelf-picker-modal" class="app-modal-backdrop" style="display:none;">
          <div class="app-modal-sheet">
            <div class="modal-drag-pill"></div>
            <div class="modal-header">
              <h3>Save to Library Shelf</h3>
              <button class="modal-close-btn" onclick="document.getElementById('shelf-picker-modal').style.display='none'">✕</button>
            </div>
            <div class="shelf-options-list">
              ${Store.SHELVES.filter(s => s.id !== 'all').map(s => `
                <button class="shelf-option-item ${isSaved && currentShelf === s.id ? 'active' : ''}" onclick="AppDetailView.assignShelf('${s.id}')">
                  <span class="shelf-icon">${s.icon}</span>
                  <span class="shelf-name">${s.name}</span>
                  ${isSaved && currentShelf === s.id ? '<span class="shelf-check">✓</span>' : ''}
                </button>
              `).join('')}
              ${isSaved ? `
                <button class="shelf-option-item remove" onclick="AppDetailView.removeBookmark()">
                  <span class="shelf-icon">🗑️</span>
                  <span class="shelf-name">Remove from Library</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      // Load Recommendations asynchronously
      this.loadRecommendations(manga);

    } catch (err) {
      console.error(err);
      root.innerHTML = `
        <div class="app-empty">
          <h3>Failed to load manga</h3>
          <p>Please check your connection and try again.</p>
          <a href="#/" class="btn-app-primary">Go to Home</a>
        </div>
      `;
    }
  },

  // ------------------------------------------------------------------
  // Chapter Filtering & Sorting
  // ------------------------------------------------------------------

  getChapterNum(ch) {
    if (!ch) return 0;
    const name = String(ch.name || '');
    if (/prologue/i.test(name)) return 0;
    const nm = name.match(/(?:chapter|ch\.?|ep\.?|episode)\s*(\d+(?:\.\d+)?)/i);
    if (nm) return parseFloat(nm[1]);
    const sm = String(ch.slug || '').match(/chapter-(\d+(?:-\d+)?)/i);
    if (sm) return parseFloat(sm[1].replace('-', '.'));
    if (typeof ch.number === 'number' && !isNaN(ch.number)) return ch.number;
    return 0;
  },

  cleanChapterName(name, num) {
    if (!name && !num) return 'Chapter 1';
    let str = String(name || '').trim();
    if (!str || /^\d+(?:\.\d+)?$/.test(str)) {
      return `Chapter ${str || num || '1'}`;
    }
    str = str.replace(/\[[^\]]*\]/gi, '');
    str = str.replace(/\([^)]*(?:\.com|\.net|\.org|\.io|\.gg|\.me|http|\/\/)[^)]*\)/gi, '');
    str = str.replace(/\s*[-–—]\s*(?:read\s+at|visit|free\s+on|scan|upload|credit|translated\s+by).*/gi, '');
    str = str.replace(/https?:\/\/\S+/gi, '');
    str = str.replace(/\s*(?:by|from|via|translated by|scanlated by|scan by)\s+[\w\s]+$/gi, '');
    str = str.replace(/^chapter\s*:\s*/i, 'Chapter: ');
    str = str.replace(/^chapter\s+side[-_\s]*story[-_\s]*(\d+)/i, 'Side Story $1');
    str = str.replace(/^chapter\s+(spoiler|notice|announcement)/i, (m, p) => p.charAt(0).toUpperCase() + p.slice(1));
    str = str.replace(/\s+:\s*/g, ': ');
    str = str.replace(/^ch\.?\s*(\d+(?:\.\d+)?)/i, 'Chapter $1');
    str = str.replace(/^ep\.?\s*(\d+(?:\.\d+)?)/i, 'Episode $1');
    if (/^chapter\s/i.test(str)) str = 'Chapter' + str.slice(7);
    str = str.replace(/\s{2,}/g, ' ').trim();
    str = str.replace(/[-–—:,;]+$/, '').trim();
    return str || (num ? `Chapter ${num}` : 'Chapter');
  },

  findFirstChapter(chapters) {
    if (!chapters || !chapters.length) return null;
    const ch0 = chapters.find(c => {
      const n = this.getChapterNum(c);
      return n === 0 || /prologue/i.test(c.name || '');
    });
    if (ch0) return ch0;

    const ch1 = chapters.find(c => this.getChapterNum(c) === 1);
    if (ch1) return ch1;

    let lowest = null;
    let lowestNum = Infinity;
    for (const c of chapters) {
      const n = this.getChapterNum(c);
      if (n >= 0 && n < lowestNum) {
        lowestNum = n;
        lowest = c;
      }
    }
    return lowest || chapters[chapters.length - 1];
  },

  getFilteredChapters() {
    let list = [...this.chaptersList];

    // Sort by chapter number
    list.sort((a, b) => {
      const numA = this.getChapterNum(a);
      const numB = this.getChapterNum(b);
      return this.isSortAsc ? numA - numB : numB - numA;
    });

    // Filter by search query
    if (this.chapterFilterQuery) {
      const q = this.chapterFilterQuery.toLowerCase().trim();
      list = list.filter(ch => {
        const name = (ch.name || '').toLowerCase();
        const slug = (ch.slug || '').toLowerCase();
        const num = String(this.getChapterNum(ch));
        return name.includes(q) || slug.includes(q) || num === q || `chapter ${num}`.includes(q) || `ch ${num}`.includes(q);
      });
    }

    return list;
  },

  renderChaptersHtml(chapters, manga, history) {
    if (!chapters || chapters.length === 0) {
      return '<p class="app-empty">No chapters matching your search.</p>';
    }
    manga = manga || this.currentManga;
    history = history || (manga ? Store.getMangaHistory(manga.slug) : null);

    return chapters.map(ch => {
      const isRead = history && history.chapterSlug === ch.slug;
      const dateStr = ch.createdAt || ch.updatedAt
        ? new Date(ch.createdAt || ch.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      const isDownloaded = window.Downloader?.isDownloaded(ch.slug);
      const isDownloading = window.Downloader?.isDownloading(ch.slug);
      const cleanName = this.cleanChapterName(ch.name, ch.number);

      return `
        <div class="app-chapter-row ${isRead ? 'read' : ''}">
          <a href="#/read/${manga.slug}/${ch.slug}" class="app-chapter-link">
            <div class="app-chapter-info">
              <div class="app-chapter-name">${this.escape(cleanName)}</div>
              <div class="app-chapter-meta">${dateStr}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
          <button class="app-chapter-dl-btn ${isDownloaded ? 'downloaded' : ''} ${isDownloading ? 'downloading' : ''}"
                  data-ch-slug="${ch.slug}"
                  title="${isDownloaded ? 'Downloaded (Tap to delete)' : 'Download offline'}"
                  onclick="AppDetailView.handleChapterDownload('${ch.slug}', event)">
            ${isDownloaded ? `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ` : isDownloading ? `
              <div class="mini-dl-spinner"></div>
            ` : `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            `}
          </button>
        </div>
      `;
    }).join('');
  },

  onFilterChapters(val) {
    this.chapterFilterQuery = val.trim();
    const container = document.getElementById('app-chapter-list-container');
    const filtered = this.getFilteredChapters();
    if (container) {
      container.innerHTML = this.renderChaptersHtml(filtered);
    }
    const countBadge = document.getElementById('app-chapter-count-badge');
    if (countBadge) {
      if (this.chapterFilterQuery) {
        countBadge.textContent = `${filtered.length} of ${this.chaptersList.length}`;
      } else {
        countBadge.textContent = `${this.chaptersList.length}`;
      }
    }
    const clearBtn = document.getElementById('app-chapter-search-clear');
    if (clearBtn) {
      clearBtn.style.display = this.chapterFilterQuery ? 'flex' : 'none';
    }
  },

  clearChapterFilter() {
    const input = document.getElementById('app-chapter-filter-input');
    if (input) input.value = '';
    this.onFilterChapters('');
  },

  toggleChapterSort() {
    this.isSortAsc = !this.isSortAsc;
    const label = document.getElementById('app-sort-order-label');
    if (label) label.textContent = this.isSortAsc ? 'Oldest First' : 'Newest First';
    const container = document.getElementById('app-chapter-list-container');
    if (container) {
      container.innerHTML = this.renderChaptersHtml(this.getFilteredChapters());
    }
    if (window.Haptics) window.Haptics.light();
  },

  // ------------------------------------------------------------------
  // Downloads
  // ------------------------------------------------------------------

  async handleChapterDownload(chapterSlug, event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    const btn = (event && event.currentTarget) || document.querySelector(`.app-chapter-dl-btn[data-ch-slug="${chapterSlug}"]`);
    const chapter = (this.chaptersList || []).find(c => c.slug === chapterSlug);
    if (!chapter || !window.Downloader) return;

    if (window.Downloader.isDownloaded(chapterSlug)) {
      // Confirm deletion
      const ok = confirm(`Delete "${chapter.name || 'Chapter'}" from offline storage?`);
      if (ok) {
        await window.Downloader.deleteChapter(chapterSlug);
        btn.classList.remove('downloaded');
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
      }
      return;
    }

    btn.classList.add('downloading');
    btn.innerHTML = `<div class="mini-dl-spinner"></div>`;

    window.Downloader.downloadChapter(
      this.currentManga,
      chapter,
      (progress) => {
        // Update mini progress
        btn.innerHTML = `<span style="font-size:0.6rem;font-weight:700;color:var(--accent-primary);">${progress.percent}%</span>`;
      },
      () => {
        btn.classList.remove('downloading');
        btn.classList.add('downloaded');
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      },
      () => {
        btn.classList.remove('downloading');
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
      }
    );
  },

  // ------------------------------------------------------------------
  // Shelf / Bookmark
  // ------------------------------------------------------------------

  openShelfPicker() {
    const modal = document.getElementById('shelf-picker-modal');
    if (modal) {
      modal.style.display = 'flex';
      if (window.Haptics) window.Haptics.light();
    }
  },

  assignShelf(shelfId) {
    if (!this.currentManga) return;
    const isSaved = Store.isBookmarked(this.currentManga.slug);
    if (!isSaved) {
      Store.toggleBookmark(this.currentManga, shelfId);
    } else {
      Store.setShelf(this.currentManga.slug, shelfId);
    }
    const modal = document.getElementById('shelf-picker-modal');
    if (modal) modal.style.display = 'none';

    if (window.App?.showToast) {
      const shelfObj = Store.SHELVES.find(s => s.id === shelfId);
      window.App.showToast(`Saved to ${shelfObj?.icon || '📚'} ${shelfObj?.name || 'Library'}`);
    }
    this.render(this.currentManga.slug);
  },

  removeBookmark() {
    if (!this.currentManga) return;
    Store.toggleBookmark(this.currentManga);
    const modal = document.getElementById('shelf-picker-modal');
    if (modal) modal.style.display = 'none';
    if (window.App?.showToast) window.App.showToast('Removed from Library');
    this.render(this.currentManga.slug);
  },

  // ------------------------------------------------------------------
  // Recommendations
  // ------------------------------------------------------------------

  async loadRecommendations(manga) {
    const firstGenre = manga.genres && manga.genres[0];
    const genreSlug = typeof firstGenre === 'object' ? firstGenre.slug : firstGenre;
    if (!genreSlug) return;

    try {
      const data = await API.search({ genres: genreSlug, sort: 'views_today' });
      const items = (data.items || []).filter(item => item.slug !== manga.slug).slice(0, 8);

      if (items.length > 0) {
        const sec = document.getElementById('recommended-section');
        const rail = document.getElementById('recommended-rail');
        if (sec && rail) {
          rail.innerHTML = items.map(m => `
            <a href="#/manga/${m.slug}" class="app-rail-card">
              <img src="${API.resolveUrl(m.cover || '')}" alt="${this.escape(m.name)}" loading="lazy" />
              <div class="app-rail-card-title">${this.escape(m.name)}</div>
            </a>
          `).join('');
          sec.style.display = 'block';
        }
      }
    } catch (e) {}
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
};

window.AppDetailView = AppDetailView;
