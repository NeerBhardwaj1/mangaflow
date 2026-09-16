// ==========================================================================
// MangaFlow App — Pro Reader View
// ==========================================================================

const AppReaderView = {
  mangaSlug: null,
  chapterSlug: null,
  chapterData: null,
  mangaData: null,
  nextChapter: null,
  previousChapter: null,
  images: [],
  currentPage: 1,
  isOffline: false,

  // Reader Settings
  mode: localStorage.getItem('mf_reader_mode') || 'webtoon', // 'webtoon' | 'paged-rtl' | 'paged-ltr'
  bgColor: localStorage.getItem('mf_reader_bg') || 'oled', // 'oled' | 'charcoal' | 'sepia' | 'white'
  invertColors: localStorage.getItem('mf_reader_invert') === 'true',
  brightness: parseInt(localStorage.getItem('mf_reader_brightness') || '100'),

  // Zoom state
  isZoomed: false,
  lastTapTime: 0,

  async render(mangaSlug, chapterSlug) {
    this.mangaSlug = mangaSlug;
    this.chapterSlug = chapterSlug;
    this.currentPage = 1;
    this.isZoomed = false;

    // Enable native Android immersive mode
    if (window.AndroidNative?.setImmersiveMode) {
      window.AndroidNative.setImmersiveMode(true);
    }

    const root = document.getElementById('app-content');
    root.innerHTML = '<div class="app-loader"><div class="app-spinner"></div></div>';

    // Hide app header and tab bar
    const header = document.getElementById('app-header');
    const tabs = document.getElementById('app-tabs');
    if (header) header.classList.add('hidden');
    if (tabs) tabs.style.display = 'none';

    try {
      // 1. Check Offline Storage First
      const offlineRecord = window.Downloader ? await window.Downloader.getChapter(chapterSlug) : null;

      if (offlineRecord && offlineRecord.images && offlineRecord.images.length > 0) {
        this.isOffline = true;
        this.chapterData = {
          name: offlineRecord.chapterName,
          slug: offlineRecord.chapterSlug,
          images: offlineRecord.images
        };
        this.mangaData = {
          name: offlineRecord.mangaName,
          slug: offlineRecord.mangaSlug,
          cover: offlineRecord.cover
        };
        this.images = offlineRecord.images;
        this.nextChapter = null;
        this.previousChapter = null;
      } else {
        this.isOffline = false;
        const data = await API.getChapter(mangaSlug, chapterSlug);
        this.chapterData = data.chapter;
        this.mangaData = data.manga;
        this.nextChapter = data.nextChapter;
        this.previousChapter = data.previousChapter;
        this.images = (this.chapterData.images || []).map(img => 
          API.resolveUrl(typeof img === 'string' ? img : img.url)
        );
      }

      // 2. Preload first few images
      this.preloadImages(0, 4);

      // 3. Save to reading history
      Store.saveHistory({
        mangaSlug: this.mangaSlug,
        mangaName: this.mangaData ? this.mangaData.name : this.mangaSlug,
        cover: this.mangaData ? this.mangaData.cover : '',
        chapterSlug: this.chapterSlug,
        chapterName: this.chapterData.name || 'Chapter',
        chapterIndex: this.currentPage
      });

      this.renderUI(root);
    } catch (err) {
      console.error('Reader load failed:', err);
      this.cleanupImmersive();
      if (header) header.classList.remove('hidden');
      if (tabs) tabs.style.display = 'flex';
      root.innerHTML = `
        <div class="app-empty">
          <h3>Failed to load chapter</h3>
          <p>The chapter pages could not be loaded. Check your connection or read downloaded chapters.</p>
          <a href="#/manga/${mangaSlug}" class="btn-app-primary">Back to Manga</a>
        </div>
      `;
    }
  },


  preloadImages(startIndex, count = 4) {
    for (let i = startIndex; i < Math.min(startIndex + count, this.images.length); i++) {
      if (this.images[i]) {
        const img = new Image();
        img.src = this.images[i];
      }
    }
  },

  renderUI(root) {
    const chName = this.chapterData.name || 'Chapter';
    const mName = this.mangaData ? this.mangaData.name : '';

    root.innerHTML = `
      <div class="app-reader reader-bg-${this.bgColor} ${this.invertColors ? 'reader-invert' : ''}" id="reader-container">
        
        <!-- Reader Brightness Dimmer Overlay -->
        <div class="reader-brightness-scrim" id="reader-brightness-scrim" style="opacity: ${(100 - this.brightness) / 100 * 0.75};"></div>

        <!-- Reader Top Bar -->
        <div class="app-reader-topbar" id="reader-topbar">
          <a href="#/manga/${this.mangaSlug}" class="app-reader-back" id="reader-back-btn" onclick="AppReaderView.cleanupImmersive()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Back</span>
          </a>

          <div class="app-reader-title-wrap">
            <div class="app-reader-title" title="${this.escape(mName)} - ${this.escape(chName)}">
              ${this.escape(chName)}
            </div>
            ${this.isOffline ? '<span class="reader-offline-badge">💾 Offline</span>' : ''}
          </div>

          <div class="app-reader-actions">
            <!-- Reader Settings Button -->
            <button class="app-reader-icon-btn" id="reader-settings-btn" aria-label="Reader Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </div>

        <!-- Reader Canvas -->
        <div class="app-reader-canvas" id="reader-canvas">
          ${this.mode === 'webtoon' ? this.renderWebtoonContent() : this.renderPagedContent()}
        </div>

        <!-- Reader Bottom Bar -->
        <div class="app-reader-bottombar" id="reader-bottombar">
          <button class="app-reader-btn" id="reader-prev-btn" ${!this.previousChapter ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Prev Ch</span>
          </button>

          <span class="app-reader-progress" id="reader-page-indicator">
            ${this.mode !== 'webtoon' ? `Page ${this.currentPage} / ${this.images.length}` : `${this.images.length} pages`}
          </span>

          <button class="app-reader-btn" id="reader-next-btn" ${!this.nextChapter ? 'disabled' : ''}>
            <span>Next Ch</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

        <!-- In-Reader Settings Sheet Modal -->
        <div id="reader-settings-sheet" class="app-modal-backdrop" style="display:none;">
          <div class="app-modal-sheet">
            <div class="modal-drag-pill"></div>
            <div class="modal-header">
              <h3>📖 Reading Preferences</h3>
              <button class="modal-close-btn" id="close-reader-settings">✕</button>
            </div>

            <!-- Reading Mode -->
            <div class="reader-pref-group">
              <label>Reading Mode</label>
              <div class="reader-mode-tabs">
                <button class="reader-mode-tab ${this.mode === 'webtoon' ? 'active' : ''}" data-mode="webtoon">Webtoon (Scroll)</button>
                <button class="reader-mode-tab ${this.mode === 'paged-rtl' ? 'active' : ''}" data-mode="paged-rtl">Manga (RTL)</button>
                <button class="reader-mode-tab ${this.mode === 'paged-ltr' ? 'active' : ''}" data-mode="paged-ltr">Comic (LTR)</button>
              </div>
            </div>

            <!-- Background Theme -->
            <div class="reader-pref-group">
              <label>Background</label>
              <div class="reader-bg-options">
                <button class="reader-bg-btn bg-opt-oled ${this.bgColor === 'oled' ? 'active' : ''}" data-bg="oled">OLED Black</button>
                <button class="reader-bg-btn bg-opt-charcoal ${this.bgColor === 'charcoal' ? 'active' : ''}" data-bg="charcoal">Charcoal</button>
                <button class="reader-bg-btn bg-opt-sepia ${this.bgColor === 'sepia' ? 'active' : ''}" data-bg="sepia">Sepia</button>
                <button class="reader-bg-btn bg-opt-white ${this.bgColor === 'white' ? 'active' : ''}" data-bg="white">White</button>
              </div>
            </div>

            <!-- Color Invert Toggle -->
            <div class="reader-pref-row">
              <div class="reader-pref-info">
                <span>Invert Colors (Night Reading)</span>
                <small>Inverts bright white scanlations to dark</small>
              </div>
              <input type="checkbox" id="reader-invert-toggle" ${this.invertColors ? 'checked' : ''} class="app-switch" />
            </div>

            <!-- Brightness Overlay Slider -->
            <div class="reader-pref-group">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <label>Screen Dimmer</label>
                <span id="brightness-val" style="font-size:0.8rem;color:var(--text-muted);">${this.brightness}%</span>
              </div>
              <input type="range" id="reader-brightness-slider" min="20" max="100" value="${this.brightness}" style="width:100%;accent-color:var(--accent-primary);" />
            </div>

          </div>
        </div>

      </div>
    `;

    this.bindEvents();
    this.bindHardwareVolume();
  },

  renderWebtoonContent() {
    if (!this.images || this.images.length === 0) {
      return '<div class="app-empty"><p>No pages available for this chapter.</p></div>';
    }

    const imgsHtml = this.images.map((src, i) => `
      <div class="app-reader-page-wrap" data-page="${i + 1}">
        <img src="${src}" alt="Page ${i + 1}" loading="${i < 3 ? 'eager' : 'lazy'}" class="reader-zoomable-img" />
      </div>
    `).join('');

    return `
      <div class="app-reader-strip" id="reader-strip">
        ${imgsHtml}
        <div class="app-reader-end">
          <h3>End of ${this.escape(this.chapterData.name || 'Chapter')}</h3>
          <p>${this.nextChapter ? 'Ready for the next chapter?' : 'You are all caught up with the latest chapter!'}</p>
          <div class="app-reader-end-actions">
            ${this.nextChapter ? `
              <a href="#/read/${this.mangaSlug}/${this.nextChapter.slug}" class="btn-app-primary">
                Next Chapter: ${this.escape(this.nextChapter.name || '')}
              </a>
            ` : ''}
            <a href="#/manga/${this.mangaSlug}" class="btn-app-secondary" style="width: auto; padding: 10px 24px; border-radius: 9999px;" onclick="AppReaderView.cleanupImmersive()">
              Back to Overview
            </a>
          </div>
          <div class="app-reader-credits">
            <span>Made with</span>
            <span class="app-credits-heart">❤</span>
            <span>by <strong class="app-credits-author">Neer Chan</strong></span>
          </div>
        </div>
      </div>
    `;
  },

  renderPagedContent() {
    if (!this.images || this.images.length === 0) {
      return '<div class="app-empty"><p>No pages available.</p></div>';
    }

    const currentImg = this.images[this.currentPage - 1];
    return `
      <div class="app-reader-paged" id="paged-viewport">
        <div class="app-reader-paged-zone left" id="zone-left"></div>
        <img src="${currentImg}" alt="Page ${this.currentPage}" id="paged-current-img" class="reader-zoomable-img" />
        <div class="app-reader-paged-zone right" id="zone-right"></div>
      </div>
    `;
  },

  bindEvents() {
    // Settings modal open/close
    const settingsBtn = document.getElementById('reader-settings-btn');
    const settingsSheet = document.getElementById('reader-settings-sheet');
    const closeSettingsBtn = document.getElementById('close-reader-settings');

    settingsBtn?.addEventListener('click', () => {
      settingsSheet.style.display = 'flex';
      if (window.Haptics) window.Haptics.light();
    });

    closeSettingsBtn?.addEventListener('click', () => {
      settingsSheet.style.display = 'none';
    });

    settingsSheet?.addEventListener('click', (e) => {
      if (e.target === settingsSheet) settingsSheet.style.display = 'none';
    });

    // Reading mode tabs
    settingsSheet?.querySelectorAll('.reader-mode-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const newMode = btn.getAttribute('data-mode');
        this.switchMode(newMode);
        settingsSheet.querySelectorAll('.reader-mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.Haptics) window.Haptics.light();
      });
    });

    // Background options
    settingsSheet?.querySelectorAll('.reader-bg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const bg = btn.getAttribute('data-bg');
        this.setBgColor(bg);
        settingsSheet.querySelectorAll('.reader-bg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.Haptics) window.Haptics.light();
      });
    });

    // Color invert
    const invertToggle = document.getElementById('reader-invert-toggle');
    invertToggle?.addEventListener('change', (e) => {
      this.invertColors = e.target.checked;
      localStorage.setItem('mf_reader_invert', this.invertColors ? 'true' : 'false');
      document.getElementById('reader-container')?.classList.toggle('reader-invert', this.invertColors);
      if (window.Haptics) window.Haptics.light();
    });

    // Brightness slider
    const brightnessSlider = document.getElementById('reader-brightness-slider');
    const brightnessVal = document.getElementById('brightness-val');
    brightnessSlider?.addEventListener('input', (e) => {
      this.brightness = parseInt(e.target.value);
      localStorage.setItem('mf_reader_brightness', this.brightness.toString());
      if (brightnessVal) brightnessVal.textContent = `${this.brightness}%`;
      const scrim = document.getElementById('reader-brightness-scrim');
      if (scrim) scrim.style.opacity = ((100 - this.brightness) / 100 * 0.75).toString();
    });

    // Prev / Next Chapter Buttons
    const prevBtn = document.getElementById('reader-prev-btn');
    const nextBtn = document.getElementById('reader-next-btn');
    if (prevBtn && this.previousChapter) {
      prevBtn.onclick = () => {
        window.location.hash = `#/read/${this.mangaSlug}/${this.previousChapter.slug}`;
      };
    }
    if (nextBtn && this.nextChapter) {
      nextBtn.onclick = () => {
        window.location.hash = `#/read/${this.mangaSlug}/${this.nextChapter.slug}`;
      };
    }

    // Paged tap zones (RTL vs LTR aware)
    if (this.mode !== 'webtoon') {
      const leftZone = document.getElementById('zone-left');
      const rightZone = document.getElementById('zone-right');

      if (this.mode === 'paged-rtl') {
        // Japanese manga: Left is forward, Right is backward
        if (leftZone) leftZone.onclick = () => this.nextPage();
        if (rightZone) rightZone.onclick = () => this.prevPage();
      } else {
        // Western / Comic: Right is forward, Left is backward
        if (rightZone) rightZone.onclick = () => this.nextPage();
        if (leftZone) leftZone.onclick = () => this.prevPage();
      }
    }

    // Double-tap zoom binding
    this.bindDoubleTapZoom();
  },

  bindDoubleTapZoom() {
    const images = document.querySelectorAll('.reader-zoomable-img');
    images.forEach(img => {
      img.addEventListener('click', (e) => {
        const now = Date.now();
        if (now - this.lastTapTime < 300) {
          // Double tap detected
          this.toggleZoom(img, e);
          this.lastTapTime = 0;
        } else {
          this.lastTapTime = now;
        }
      });
    });
  },

  toggleZoom(img, e) {
    if (this.isZoomed) {
      img.style.transform = 'none';
      img.style.transformOrigin = 'center center';
      this.isZoomed = false;
    } else {
      const rect = img.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
      img.style.transform = 'scale(2.2)';
      this.isZoomed = true;
      if (window.Haptics) window.Haptics.light();
    }
  },

  bindHardwareVolume() {
    window.addEventListener('mf-volume-key', (e) => {
      const dir = e.detail?.direction;
      if (dir === 'down') {
        // Volume down -> Next Page or Scroll down
        if (this.mode === 'webtoon') {
          window.scrollBy({ top: 450, behavior: 'smooth' });
        } else {
          this.nextPage();
        }
        if (window.Haptics) window.Haptics.light();
      } else if (dir === 'up') {
        // Volume up -> Prev Page or Scroll up
        if (this.mode === 'webtoon') {
          window.scrollBy({ top: -450, behavior: 'smooth' });
        } else {
          this.prevPage();
        }
        if (window.Haptics) window.Haptics.light();
      }
    });
  },

  switchMode(newMode) {
    this.mode = newMode;
    localStorage.setItem('mf_reader_mode', newMode);
    const canvas = document.getElementById('reader-canvas');
    if (!canvas) return;

    if (newMode === 'webtoon') {
      canvas.innerHTML = this.renderWebtoonContent();
    } else {
      canvas.innerHTML = this.renderPagedContent();
    }

    const ind = document.getElementById('reader-page-indicator');
    if (ind) {
      ind.textContent = newMode !== 'webtoon' ? `Page ${this.currentPage} / ${this.images.length}` : `${this.images.length} pages`;
    }

    this.bindEvents();
  },

  setBgColor(bg) {
    this.bgColor = bg;
    localStorage.setItem('mf_reader_bg', bg);
    const container = document.getElementById('reader-container');
    if (container) {
      container.className = `app-reader reader-bg-${bg} ${this.invertColors ? 'reader-invert' : ''}`;
    }
  },

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedImage();
      if (window.Haptics) window.Haptics.light();
    } else if (this.previousChapter) {
      window.location.hash = `#/read/${this.mangaSlug}/${this.previousChapter.slug}`;
    }
  },

  nextPage() {
    if (this.currentPage < this.images.length) {
      this.currentPage++;
      this.updatePagedImage();
      // Preload next batch
      this.preloadImages(this.currentPage, 4);
      if (window.Haptics) window.Haptics.light();
    } else if (this.nextChapter) {
      window.location.hash = `#/read/${this.mangaSlug}/${this.nextChapter.slug}`;
    }
  },

  updatePagedImage() {
    const img = document.getElementById('paged-current-img');
    if (img) {
      img.src = this.images[this.currentPage - 1];
      img.alt = `Page ${this.currentPage}`;
      img.style.transform = 'none';
      this.isZoomed = false;
    }
    const ind = document.getElementById('reader-page-indicator');
    if (ind) {
      ind.textContent = `Page ${this.currentPage} / ${this.images.length}`;
    }
    // Update history reading position
    Store.saveHistory({
      mangaSlug: this.mangaSlug,
      mangaName: this.mangaData ? this.mangaData.name : this.mangaSlug,
      cover: this.mangaData ? this.mangaData.cover : '',
      chapterSlug: this.chapterSlug,
      chapterName: this.chapterData.name || 'Chapter',
      chapterIndex: this.currentPage
    });
  },

  cleanupImmersive() {
    if (window.AndroidNative?.setImmersiveMode) {
      window.AndroidNative.setImmersiveMode(false);
    }
    const header = document.getElementById('app-header');
    const tabs = document.getElementById('app-tabs');
    const tabsWrap = document.getElementById('app-tabs-wrap');
    if (header) header.classList.remove('hidden');
    if (tabs) tabs.style.display = '';
    if (tabsWrap) tabsWrap.classList.remove('hidden');
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
};

window.AppReaderView = AppReaderView;
