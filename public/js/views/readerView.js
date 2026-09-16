// ==========================================================================
// MangaFlow Pro Reader View (Webtoon Strip & Paged Flip)
// ==========================================================================

const ReaderView = {
  mangaSlug: null,
  chapterSlug: null,
  chapterData: null,
  mangaData: null,
  images: [],
  currentPage: 1,
  readingMode: 'webtoon', // 'webtoon' or 'paged'
  readerWidth: 'md', // 'sm', 'md', 'lg', 'full'
  keyHandler: null,
  scrollHandler: null,

  async render(mangaSlug, chapterSlug) {
    this.mangaSlug = mangaSlug;
    this.chapterSlug = chapterSlug;

    // Load saved settings
    const settings = Store.getReaderSettings();
    this.readingMode = settings.mode || 'webtoon';
    this.readerWidth = settings.width || 'md';

    const root = document.getElementById('app-root');
    root.innerHTML = `
      <div class="page-loader" style="min-height: 80vh;">
        <div class="loader-spinner"></div>
        <p class="loader-text">Loading chapter pages...</p>
      </div>
    `;

    // Hide main site header in reader mode for full immersion
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) mainHeader.style.display = 'none';

    try {
      const data = await API.getChapter(mangaSlug, chapterSlug);
      this.chapterData = data.chapter;
      this.mangaData = data.manga;
      this.nextChapter = data.nextChapter;
      this.previousChapter = data.previousChapter;
      this.images = this.chapterData.images || [];
      this.currentPage = 1;

      // Save to reading history
      Store.saveHistory({
        manga: this.mangaData,
        chapter: this.chapterData,
        page: 1,
      });

      this.renderReaderUI(root);
      this.bindControls();
    } catch (err) {
      if (mainHeader) mainHeader.style.display = 'flex';
      root.innerHTML = `
        <div class="container" style="padding: 80px 24px; text-align: center;">
          <h2 style="margin-bottom: 12px;">Failed to Load Chapter</h2>
          <p class="text-muted" style="margin-bottom: 24px;">The chapter images could not be loaded. Please try another chapter or refresh.</p>
          <a href="#/manga/${mangaSlug}" class="btn-glow-primary">Back to Series</a>
        </div>
      `;
    }
  },

  renderReaderUI(root) {
    const manga = this.mangaData;
    const chapter = this.chapterData;
    const chaptersList = manga.chapters || [];

    root.innerHTML = `
      <div class="reader-container" id="reader-container">
        
        <!-- Floating Top Navigation Bar -->
        <header class="reader-topbar" id="reader-topbar">
          <div class="reader-nav-left">
            <a href="#/manga/${this.mangaSlug}" class="reader-back-btn" title="Back to Series">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
              <span>Back</span>
            </a>
            <div>
              <h2 class="reader-manga-title">${this.escapeHtml(manga.name)}</h2>
              <span class="reader-chapter-label">${this.escapeHtml(chapter.name || 'Chapter')}</span>
            </div>
          </div>

          <div class="reader-nav-right">
            <!-- Chapter Jump Select -->
            ${chaptersList.length > 0 ? `
              <select class="chapter-select-dropdown" id="chapter-select" onchange="ReaderView.onSelectChapter(this.value)">
                ${chaptersList.map((ch) => `
                  <option value="${ch.slug}" ${ch.slug === this.chapterSlug ? 'selected' : ''}>
                    ${this.escapeHtml(ch.name)}
                  </option>
                `).join('')}
              </select>
            ` : ''}

            <!-- Reading Mode Switcher -->
            <div class="mode-toggle-group">
              <button class="mode-btn ${this.readingMode === 'webtoon' ? 'active' : ''}" onclick="ReaderView.setMode('webtoon')">Webtoon</button>
              <button class="mode-btn ${this.readingMode === 'paged' ? 'active' : ''}" onclick="ReaderView.setMode('paged')">Paged</button>
            </div>

            <!-- Fullscreen Toggle -->
            <button class="icon-btn" onclick="ReaderView.toggleFullscreen()" title="Toggle Fullscreen (F)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
            </button>
          </div>
        </header>

        <!-- Reader Canvas -->
        <main class="reader-canvas" id="reader-canvas">
          ${this.readingMode === 'webtoon' ? this.renderWebtoonStrip() : this.renderPagedView()}
        </main>

        <!-- Floating Bottom Navigation Bar -->
        <div class="reader-bottombar" id="reader-bottombar">
          <button class="reader-btn" ${!this.previousChapter ? 'disabled' : ''} onclick="ReaderView.goToPreviousChapter()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span class="lbl">Prev Chapter</span>
          </button>

          <span class="reader-progress-tag" id="reader-page-counter">
            ${this.readingMode === 'paged' ? `Page ${this.currentPage} / ${this.images.length}` : `${this.images.length} Pages`}
          </span>

          <button class="reader-btn" ${!this.nextChapter ? 'disabled' : ''} onclick="ReaderView.goToNextChapter()">
            <span class="lbl">Next Chapter</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

      </div>
    `;
  },

  renderWebtoonStrip() {
    return `
      <div class="webtoon-strip width-${this.readerWidth}" id="webtoon-strip">
        ${this.images.map((imgUrl, idx) => `
          <div class="webtoon-page" data-page="${idx + 1}">
            <img src="${imgUrl}" alt="Page ${idx + 1}" loading="${idx < 3 ? 'eager' : 'lazy'}" />
          </div>
        `).join('')}

        <!-- End of Chapter Card -->
        <div class="chapter-nav-card">
          <h3>You've finished ${this.escapeHtml(this.chapterData.name || 'this chapter')}!</h3>
          <p>Ready for the next exciting chapter?</p>
          <div class="chapter-nav-buttons">
            ${this.previousChapter ? `
              <button class="reader-btn" onclick="ReaderView.goToPreviousChapter()">
                ← ${this.escapeHtml(this.previousChapter.name || 'Previous Chapter')}
              </button>
            ` : ''}
            ${this.nextChapter ? `
              <button class="btn-read-primary" style="padding: 8px 20px;" onclick="ReaderView.goToNextChapter()">
                Continue to ${this.escapeHtml(this.nextChapter.name || 'Next Chapter')} →
              </button>
            ` : `<p class="text-muted">You are all caught up to the latest chapter!</p>`}
          </div>
        </div>
      </div>
    `;
  },

  renderPagedView() {
    const currentImg = this.images[this.currentPage - 1];
    return `
      <div class="paged-canvas">
        <!-- Click navigation zones -->
        <div class="paged-nav-zone paged-nav-left" onclick="ReaderView.prevPage()" title="Previous Page (ArrowLeft)"></div>
        <div class="paged-nav-zone paged-nav-right" onclick="ReaderView.nextPage()" title="Next Page (ArrowRight)"></div>

        <div class="paged-image-wrapper">
          <img id="paged-current-img" src="${currentImg}" alt="Page ${this.currentPage}" />
        </div>
      </div>
    `;
  },

  bindControls() {
    // Keyboard Shortcuts
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = (e) => {
      if (e.key === 'ArrowRight') {
        if (this.readingMode === 'paged') this.nextPage();
        else if (this.nextChapter) this.goToNextChapter();
      } else if (e.key === 'ArrowLeft') {
        if (this.readingMode === 'paged') this.prevPage();
        else if (this.previousChapter) this.goToPreviousChapter();
      } else if (e.key.toLowerCase() === 'f') {
        this.toggleFullscreen();
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    // Scroll progress observer for webtoon mode
    if (this.readingMode === 'webtoon') {
      if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = () => {
        const pages = document.querySelectorAll('.webtoon-page');
        let visiblePage = 1;
        const scrollY = window.scrollY + 200;

        pages.forEach((p) => {
          if (p.offsetTop <= scrollY) {
            visiblePage = parseInt(p.getAttribute('data-page'), 10);
          }
        });

        const counter = document.getElementById('reader-page-counter');
        if (counter) {
          counter.textContent = `Page ${visiblePage} / ${this.images.length}`;
        }
      };
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
  },

  setMode(mode) {
    this.readingMode = mode;
    Store.saveReaderSettings({ mode });
    const canvas = document.getElementById('reader-canvas');
    if (!canvas) return;

    if (mode === 'webtoon') {
      canvas.innerHTML = this.renderWebtoonStrip();
    } else {
      this.currentPage = 1;
      canvas.innerHTML = this.renderPagedView();
    }

    // Update buttons
    const btns = document.querySelectorAll('.mode-btn');
    btns.forEach((b) => {
      if (b.textContent.toLowerCase() === mode) b.classList.add('active');
      else b.classList.remove('active');
    });

    const counter = document.getElementById('reader-page-counter');
    if (counter) {
      counter.textContent = mode === 'paged' ? `Page ${this.currentPage} / ${this.images.length}` : `${this.images.length} Pages`;
    }

    this.bindControls();
  },

  nextPage() {
    if (this.currentPage < this.images.length) {
      this.currentPage++;
      this.updatePagedImage();
    } else if (this.nextChapter) {
      this.goToNextChapter();
    }
  },

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedImage();
    } else if (this.previousChapter) {
      this.goToPreviousChapter();
    }
  },

  updatePagedImage() {
    const img = document.getElementById('paged-current-img');
    if (img) {
      img.src = this.images[this.currentPage - 1];
      img.alt = `Page ${this.currentPage}`;
    }
    const counter = document.getElementById('reader-page-counter');
    if (counter) {
      counter.textContent = `Page ${this.currentPage} / ${this.images.length}`;
    }
  },

  onSelectChapter(slug) {
    if (!slug || slug === this.chapterSlug) return;
    window.location.hash = `#/read/${this.mangaSlug}/${slug}`;
  },

  goToNextChapter() {
    if (!this.nextChapter) return;
    window.location.hash = `#/read/${this.mangaSlug}/${this.nextChapter.slug}`;
  },

  goToPreviousChapter() {
    if (!this.previousChapter) return;
    window.location.hash = `#/read/${this.mangaSlug}/${this.previousChapter.slug}`;
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  },

  cleanup() {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) mainHeader.style.display = 'flex';
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

window.ReaderView = ReaderView;
