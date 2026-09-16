// ==========================================================================
// MangaFlow Home View
// ==========================================================================

const HomeView = {
  activeHeroIndex: 0,
  heroTimer: null,

  async render() {
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <div class="page-loader">
        <div class="loader-spinner"></div>
        <p class="loader-text">Loading MangaFlow universe...</p>
      </div>
    `;

    try {
      const data = await API.getHome();
      this.renderContent(root, data);
    } catch (err) {
      root.innerHTML = `
        <div class="container" style="padding: 80px 24px; text-align: center;">
          <h2 style="margin-bottom: 12px;">Unable to load manga feed</h2>
          <p class="text-muted" style="margin-bottom: 24px;">Please check your connection or retry in a few moments.</p>
          <button class="btn-glow-primary" onclick="window.location.reload()">Retry Connection</button>
        </div>
      `;
    }
  },

  renderContent(root, data) {
    const heroItems = data.heroItems || [];
    const trendingItems = data.trendingItems || [];
    const popularItems = data.popularItems || [];
    const latestItems = Array.isArray(data.latest) ? data.latest : (data.latest?.items || []);
    const readingHistory = Store.getHistory();

    root.innerHTML = `
      <!-- Hero Section -->
      ${this.renderHeroSection(heroItems)}

      <div class="container">
        
        <!-- Continue Reading Section -->
        ${this.renderContinueReading(readingHistory)}

        <!-- Trending Rail -->
        <section class="section">
          <div class="section-header">
            <div class="section-title-group">
              <div class="section-icon-pill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3 17 6-6 4 4 8-8"></path><path d="M14 7h7v7"></path></svg>
              </div>
              <h2 class="section-title">Trending Today</h2>
            </div>
            <a href="#/search?sort=views_today" class="section-link">
              See All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
          </div>
          <div class="snap-rail-wrapper">
            <div class="snap-rail" id="trending-rail">
              ${trendingItems.map((item, idx) => this.renderTrendingCard(item, idx + 1)).join('')}
            </div>
          </div>
        </section>

        <!-- Popular Updates Grid -->
        <section class="section">
          <div class="section-header">
            <div class="section-title-group">
              <div class="section-icon-pill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </div>
              <h2 class="section-title">Popular Updates</h2>
            </div>
            <a href="#/search?sort=views_today" class="section-link">
              Browse All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
          </div>
          <div class="manga-grid">
            ${popularItems.slice(0, 12).map((item) => this.renderMangaCard(item)).join('')}
          </div>
        </section>

        <!-- Latest Releases Grid -->
        <section class="section" style="padding-top: 10px;">
          <div class="section-header">
            <div class="section-title-group">
              <div class="section-icon-pill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <h2 class="section-title">Fresh Chapter Releases</h2>
            </div>
            <a href="#/latest" class="section-link">
              View All Updates
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
          </div>
          <div class="manga-grid">
            ${latestItems.slice(0, 18).map((item) => this.renderMangaCard(item)).join('')}
          </div>
        </section>

      </div>
    `;

    this.initHeroSlider(heroItems);
  },

  renderContinueReading(history) {
    if (!history || history.length === 0) return '';
    const items = history.slice(0, 8);

    return `
      <section class="section" style="padding-bottom: 20px;">
        <div class="section-header">
          <div class="section-title-group">
            <div class="section-icon-pill">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
            <h2 class="section-title">Continue Reading</h2>
          </div>
          <a href="#/library?tab=history" class="section-link">
            Full History
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>
        <div class="continue-reading-rail">
          ${items.map(item => `
            <a href="#/read/${item.mangaSlug}/${item.chapterSlug}" class="continue-card">
              <img class="continue-card-thumb" src="${item.cover}" alt="${this.escapeHtml(item.mangaName)}" loading="lazy" />
              <div class="continue-card-info">
                <div class="continue-card-title">${this.escapeHtml(item.mangaName)}</div>
                <div class="continue-card-chapter">${this.escapeHtml(item.chapterName || 'Chapter')}</div>
              </div>
              <span class="continue-card-btn">Resume</span>
            </a>
          `).join('')}
        </div>
      </section>
    `;
  },

  renderHeroSection(items) {
    if (!items || items.length === 0) return '';
    const first = items[0];
    const isSaved = Store.isBookmarked(first.slug);

    return `
      <section class="hero-section">
        <div class="container">
          <div class="hero-slider-container" id="hero-slider">
            <div class="hero-slide-bg" id="hero-bg" style="background-image: url('${first.cover}');"></div>
            <div class="hero-slide-overlay"></div>
            
            <!-- Sakura Particles -->
            <div class="hero-particles">
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
            </div>
            
            <div class="hero-slide">
              <div class="hero-slide-content">
                <div class="hero-badge-row">
                  <span class="badge-tag badge-spotlight">Spotlight #1</span>
                  <span class="badge-tag" style="background: rgba(16, 185, 129, 0.12); color: var(--accent-emerald); border: 1px solid rgba(16, 185, 129, 0.25);">100% Free • No Sign-in Needed</span>
                  ${first.status ? `<span class="badge-tag">${first.status.toUpperCase()}</span>` : ''}
                  <span class="badge-tag badge-rating">★ ${first.rating || '5.0'}</span>
                </div>
                <h1 class="hero-title" id="hero-title">${this.escapeHtml(first.name)}</h1>
                <p class="hero-description" id="hero-desc">${this.escapeHtml(first.summary || 'Dive into an unforgettable sequential art journey filled with breathtaking artwork and exhilarating twists.')}</p>
                
                <div class="hero-actions">
                  <a href="#/manga/${first.slug}" class="btn-hero-read" id="hero-read-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Read Now
                  </a>
                  <button class="btn-hero-bookmark ${isSaved ? 'saved' : ''}" id="hero-bookmark-btn" onclick="HomeView.toggleHeroBookmark('${first.slug}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    <span>${isSaved ? 'In Library' : 'Add to Library'}</span>
                  </button>
                </div>
              </div>

              <div class="hero-poster-wrapper">
                <img id="hero-poster" class="hero-poster" src="${first.cover}" alt="${this.escapeHtml(first.name)}" loading="eager" />
              </div>
            </div>

            <!-- Arrow Controls -->
            <div class="slider-arrows">
              <button class="slider-arrow-btn" onclick="HomeView.prevHero()" aria-label="Previous Slide">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button class="slider-arrow-btn" onclick="HomeView.nextHero()" aria-label="Next Slide">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  renderTrendingCard(item, rank) {
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    return `
      <a href="#/manga/${item.slug}" class="manga-card">
        <div class="manga-card-poster-wrap">
          <span class="rank-badge ${rankClass}">${rank}</span>
          <img class="manga-card-poster" src="${item.cover}" alt="${this.escapeHtml(item.name)}" loading="lazy" />
          <div class="manga-card-overlay-bottom"></div>
        </div>
        <div class="manga-card-info">
          <h3 class="manga-card-title">${this.escapeHtml(item.name)}</h3>
          <div class="manga-card-meta">
            <span class="meta-item meta-rating">★ ${item.rating || '5.0'}</span>
            ${item.displayViews ? `<span class="meta-item">${item.displayViews} views</span>` : ''}
          </div>
        </div>
      </a>
    `;
  },

  renderMangaCard(item) {
    const latestChap = item.latestChapters?.[0]?.name || (item.displayChapters ? item.displayChapters : '');
    return `
      <a href="#/manga/${item.slug}" class="manga-card">
        <div class="manga-card-poster-wrap">
          ${item.isHot ? '<div class="card-badge-top-right"><span class="badge-hot">HOT</span></div>' : ''}
          <img class="manga-card-poster" src="${item.cover}" alt="${this.escapeHtml(item.name)}" loading="lazy" />
          <div class="manga-card-overlay-bottom"></div>
          ${latestChap ? `<span class="badge-chapter-bottom">${this.escapeHtml(latestChap)}</span>` : ''}
        </div>
        <div class="manga-card-info">
          <h3 class="manga-card-title">${this.escapeHtml(item.name)}</h3>
          <div class="manga-card-meta">
            <span class="meta-item meta-rating">★ ${item.rating || '5.0'}</span>
            ${item.displayUpdatedShort ? `<span class="meta-item">${item.displayUpdatedShort}</span>` : ''}
          </div>
        </div>
      </a>
    `;
  },

  initHeroSlider(items) {
    if (!items || items.length < 2) return;
    this.heroItems = items;
    this.activeHeroIndex = 0;

    clearInterval(this.heroTimer);
    this.heroTimer = setInterval(() => {
      this.nextHero();
    }, 6000);
  },

  updateHeroSlide() {
    const item = this.heroItems[this.activeHeroIndex];
    if (!item) return;

    const bg = document.getElementById('hero-bg');
    const poster = document.getElementById('hero-poster');
    const title = document.getElementById('hero-title');
    const desc = document.getElementById('hero-desc');
    const readBtn = document.getElementById('hero-read-btn');
    const bookmarkBtn = document.getElementById('hero-bookmark-btn');

    if (bg) bg.style.backgroundImage = `url('${item.cover}')`;
    if (poster) {
      poster.src = item.cover;
      poster.alt = item.name;
    }
    if (title) title.textContent = item.name;
    if (desc) desc.textContent = item.summary || 'Dive into an unforgettable sequential art journey.';
    if (readBtn) readBtn.href = `#/manga/${item.slug}`;

    if (bookmarkBtn) {
      const isSaved = Store.isBookmarked(item.slug);
      bookmarkBtn.className = `btn-hero-bookmark ${isSaved ? 'saved' : ''}`;
      bookmarkBtn.onclick = () => HomeView.toggleHeroBookmark(item.slug);
      bookmarkBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        <span>${isSaved ? 'In Library' : 'Add to Library'}</span>
      `;
    }
  },

  nextHero() {
    if (!this.heroItems || this.heroItems.length === 0) return;
    this.activeHeroIndex = (this.activeHeroIndex + 1) % this.heroItems.length;
    this.updateHeroSlide();
  },

  prevHero() {
    if (!this.heroItems || this.heroItems.length === 0) return;
    this.activeHeroIndex = (this.activeHeroIndex - 1 + this.heroItems.length) % this.heroItems.length;
    this.updateHeroSlide();
  },

  toggleHeroBookmark(slug) {
    const item = this.heroItems?.find((x) => x.slug === slug);
    if (!item) return;
    const added = Store.toggleBookmark(item);
    this.updateHeroSlide();
    App.showToast(added ? `Added "${item.name}" to Library` : `Removed "${item.name}" from Library`);
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

window.HomeView = HomeView;
