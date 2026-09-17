// ==========================================================================
// MangaFlow Manga Detail View
// ==========================================================================

const DetailView = {
  currentManga: null,
  chaptersList: [],
  isSortAsc: false,
  chapterFilterQuery: '',

  async render(slug) {
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <div class="page-loader">
        <div class="loader-spinner"></div>
        <p class="loader-text">Loading manga details...</p>
      </div>
    `;

    try {
      const manga = await API.getManga(slug);
      this.currentManga = manga;
      this.chaptersList = manga.chapters || [];
      this.isSortAsc = false;
      this.chapterFilterQuery = '';

      this.renderContent(root, manga);
    } catch (err) {
      root.innerHTML = `
        <div class="container" style="padding: 80px 24px; text-align: center;">
          <h2 style="margin-bottom: 12px;">Manga Not Found</h2>
          <p class="text-muted" style="margin-bottom: 24px;">The series you are looking for might have been moved or does not exist.</p>
          <a href="#/search" class="btn-glow-primary">Browse All Comics</a>
        </div>
      `;
    }
  },

  renderContent(root, manga) {
    const isSaved = Store.isBookmarked(manga.slug);
    const history = Store.getMangaHistory(manga.slug);
    
    // Sort chapters initially (descending by default)
    const sortedChapters = this.getFilteredChapters();
    const firstChapter = manga.firstChapter && manga.firstChapter.slug
      ? manga.firstChapter
      : (manga.chapters && manga.chapters.length > 0 ? this.findFirstChapter(manga.chapters) : null);
    const latestChapter = manga.chapters && manga.chapters.length > 0 ? manga.chapters[0] : null;

    root.innerHTML = `
      <!-- Ambient Backdrop -->
      <div class="detail-hero-backdrop" style="background-image: url('${manga.cover}');"></div>

      <div class="container detail-view-container">
        
        <!-- Main Info Card -->
        <div class="detail-main-panel">
          
          <!-- Left Column: Poster & Quick CTAs -->
          <div class="detail-poster-col">
            <img class="detail-poster" src="${manga.cover}" alt="${this.escapeHtml(manga.name)}" />
            
            <div class="detail-actions-vertical">
              ${history ? `
                <a href="#/read/${manga.slug}/${history.chapterSlug}" class="btn-read-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  Resume ${this.escapeHtml(this.cleanChapterName(history.chapterName || 'Chapter'))}
                </a>
              ` : firstChapter ? `
                <a href="#/read/${manga.slug}/${firstChapter.slug}" class="btn-read-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  Start Reading
                </a>
              ` : ''}

              <button id="detail-bookmark-btn" class="btn-bookmark-action ${isSaved ? 'active' : ''}" onclick="DetailView.toggleBookmark()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                <span>${isSaved ? 'Bookmarked in Library' : 'Add to Bookmarks'}</span>
              </button>
            </div>
          </div>

          <!-- Right Column: Details & Synopsis -->
          <div class="detail-info-col">
            <div class="detail-meta-badges">
              ${manga.status ? `
                <span class="badge-status ${manga.status === 'completed' ? 'status-completed' : 'status-ongoing'}">
                  ${manga.status.toUpperCase()}
                </span>
              ` : ''}
              ${manga.type ? `<span class="badge-tag">${(typeof manga.type === 'object' ? manga.type.name || '' : manga.type).toUpperCase()}</span>` : ''}
              <span class="badge-tag badge-rating">★ ${manga.rating || '5.0'} (${manga.ratingsCount || 0} reviews)</span>
            </div>

            <h1 class="detail-title">${this.escapeHtml(manga.name)}</h1>
            ${manga.altName ? `<p class="detail-alt-names">${this.escapeHtml(manga.altName)}</p>` : ''}

            <!-- Stats Bar with Glass Cards -->
            <div class="detail-stats-bar">
              <div class="stat-item">
                <span class="stat-val">${manga.displayViews || (manga.stats?.views ? manga.stats.views.toLocaleString() : '0')}</span>
                <span class="stat-lbl">Total Views</span>
              </div>
              <div class="stat-item">
                <span class="stat-val">${manga.displayBookmarks || (manga.stats?.bookmarksCount ? manga.stats.bookmarksCount.toLocaleString() : '0')}</span>
                <span class="stat-lbl">Bookmarks</span>
              </div>
              <div class="stat-item">
                <span class="stat-val">${manga.chapters?.length || 0}</span>
                <span class="stat-lbl">Chapters</span>
              </div>
              ${manga.authors?.[0] ? `
                <div class="stat-item">
                  <span class="stat-val" style="font-size: 0.95rem; font-weight: 600;">${this.escapeHtml(manga.authors[0].name)}</span>
                  <span class="stat-lbl">Author / Creator</span>
                </div>
              ` : ''}
            </div>

            <!-- Genres -->
            <div class="detail-genres">
              ${(manga.genres || []).map((g) => `
                <a href="#/search?genres=${encodeURIComponent(g.slug)}" class="genre-tag">${this.escapeHtml(g.name)}</a>
              `).join('')}
            </div>

            <!-- Synopsis -->
            <h3 class="detail-synopsis-title">Synopsis</h3>
            <p class="detail-synopsis">${this.escapeHtml(manga.summary || 'No synopsis provided.')}</p>
          </div>

        </div>

        <!-- Chapters List Section -->
        <div class="chapters-card">
          <div class="chapters-header">
            <h2 class="chapters-title">
              All Chapters
              <span class="chapters-count-pill">${manga.chapters?.length || 0}</span>
            </h2>

            <div class="chapters-controls">
              <!-- Search inside chapters -->
              <div class="chapter-search-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="chapter-filter-input" placeholder="Find chapter..." oninput="DetailView.onFilterChapters(this.value)" />
              </div>

              <!-- Order Toggle -->
              <button class="btn-sort-chapters" onclick="DetailView.toggleChapterSort()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                <span id="sort-order-label">${this.isSortAsc ? 'Ascending' : 'Descending'}</span>
              </button>
            </div>
          </div>

          <!-- Chapters Container -->
          <div class="chapters-grid" id="chapters-list-container">
            ${this.renderChaptersGrid(sortedChapters)}
          </div>
        </div>

      </div>
    `;
  },

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
    list.sort((a, b) => {
      const numA = this.getChapterNum(a);
      const numB = this.getChapterNum(b);
      return this.isSortAsc ? numA - numB : numB - numA;
    });

    if (this.chapterFilterQuery) {
      const q = this.chapterFilterQuery.toLowerCase().trim();
      list = list.filter((ch) => {
        const name = (ch.name || '').toLowerCase();
        const slug = (ch.slug || '').toLowerCase();
        const num = String(this.getChapterNum(ch));
        return name.includes(q) || slug.includes(q) || num === q || `chapter ${num}`.includes(q);
      });
    }
    return list;
  },

  renderChaptersGrid(chapters) {
    if (!chapters || chapters.length === 0) {
      return `<p class="text-muted" style="grid-column: 1 / -1; padding: 20px; text-align: center;">No chapters matching your search.</p>`;
    }

    const history = Store.getMangaHistory(this.currentManga.slug);
    const readChapterSlug = history ? history.chapterSlug : null;

    return chapters.map((ch) => {
      const isRead = readChapterSlug === ch.slug;
      const cleanName = this.cleanChapterName(ch.name, ch.number);
      return `
        <a href="#/read/${this.currentManga.slug}/${ch.slug}" class="chapter-item ${isRead ? 'read' : ''}">
          <span class="chapter-item-name" title="${this.escapeHtml(cleanName)}">${this.escapeHtml(cleanName)}</span>
          <span class="chapter-item-meta">${ch.views ? `${ch.views} views` : ''}</span>
        </a>
      `;
    }).join('');
  },

  onFilterChapters(val) {
    this.chapterFilterQuery = val.trim();
    const container = document.getElementById('chapters-list-container');
    if (container) {
      container.innerHTML = this.renderChaptersGrid(this.getFilteredChapters());
    }
  },

  toggleChapterSort() {
    this.isSortAsc = !this.isSortAsc;
    const label = document.getElementById('sort-order-label');
    if (label) label.textContent = this.isSortAsc ? 'Ascending' : 'Descending';
    const container = document.getElementById('chapters-list-container');
    if (container) {
      container.innerHTML = this.renderChaptersGrid(this.getFilteredChapters());
    }
  },

  toggleBookmark() {
    if (!this.currentManga) return;
    const added = Store.toggleBookmark(this.currentManga);
    const btn = document.getElementById('detail-bookmark-btn');
    if (btn) {
      btn.className = `btn-bookmark-action ${added ? 'active' : ''}`;
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${added ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        <span>${added ? 'Bookmarked in Library' : 'Add to Bookmarks'}</span>
      `;
    }
    App.showToast(added ? `Added to Library!` : `Removed from Library`);
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

window.DetailView = DetailView;
