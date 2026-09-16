// ==========================================================================
// Curated Famous & Iconic Manga (Demon Slayer, Dandadan, A Silent Voice, One Piece, etc.)
// ==========================================================================
const FAMOUS_MANGA_PRIORITY = [
  {
    name: 'Demon Slayer: Kimetsu no Yaiba',
    slug: 'kimetsu-no-yaiba',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fa5a9645b9b9b.webp',
    status: 'Completed',
    rating: '5.0',
    displayChapters: '243 chapters',
    displayViews: '5.8M views',
    summary: 'Tanjiro Kamado sets out on a perilous path to become a demon slayer to avenge his slaughtered family and cure his cursed sister Nezuko.',
    isHot: true,
  },
  {
    name: 'Dandadan',
    slug: 'dandadan',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F4d5d46b27986.webp',
    status: 'Ongoing',
    rating: '4.9',
    displayChapters: '281 chapters',
    displayViews: '3.4M views',
    summary: 'Momo Ayase, who believes in ghosts, and Okarun, who believes in aliens, find out both occult forces are terrifyingly real.',
    isHot: true,
  },
  {
    name: 'A Silent Voice',
    slug: 'koe-no-katachi',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fca48cd0a0a4b.webp',
    status: 'Completed',
    rating: '5.0',
    displayChapters: '64 chapters',
    displayViews: '2.9M views',
    summary: 'Shoya Ishida seeks redemption after bullying Shoko Nishimiya, a deaf girl, in elementary school, striving to make amends and understand her heart.',
    isHot: true,
  },
  {
    name: 'Tokyo Revengers',
    slug: 'tokyo-revengers',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fd1169daa65e8.webp',
    status: 'Completed',
    rating: '4.9',
    displayChapters: '317 chapters',
    displayViews: '4.2M views',
    summary: 'Takemichi Hanagaki travels back 12 years in time to his middle school days to save his ex-girlfriend Hinata Tachibana from the Tokyo Manji Gang.',
    isHot: true,
  },
  {
    name: 'One Piece',
    slug: 'one-piece',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F475200263dfc.webp',
    status: 'Ongoing',
    rating: '5.0',
    displayChapters: '1,308 chapters',
    displayViews: '12.5M views',
    summary: 'Monkey D. Luffy and the Straw Hat Pirates embark on the Grand Line to find the legendary treasure One Piece and become King of the Pirates.',
    isHot: true,
  },
  {
    name: 'Solo Leveling',
    slug: 'solo-leveling',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fc8ccb9d017d6.webp',
    status: 'Completed',
    rating: '5.0',
    displayChapters: '270 chapters',
    displayViews: '9.8M views',
    summary: 'Sung Jinwoo, known as the weakest hunter of all humanity, awakes in a hospital with a mysterious quest log that allows him to level up infinitely.',
    isHot: true,
  },
  {
    name: 'Jujutsu Kaisen',
    slug: 'jujutsu-kaisen',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fad0cc8942378.webp',
    status: 'Completed',
    rating: '4.9',
    displayChapters: '478 chapters',
    displayViews: '6.7M views',
    summary: 'Yuji Itadori swallows a cursed finger of the King of Curses Sukuna and enrolls in Tokyo Jujutsu High to fight deadly supernatural curses.',
    isHot: true,
  },
  {
    name: 'Chainsaw Man',
    slug: 'chainsaw-man',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fa2a5ac41ca4e.webp',
    status: 'Ongoing',
    rating: '4.9',
    displayChapters: '392 chapters',
    displayViews: '5.1M views',
    summary: 'Denji makes a contract with the Chainsaw Devil Pochita and is reborn as Chainsaw Man, joining the Public Safety Devil Hunters.',
    isHot: true,
  },
  {
    name: 'Attack on Titan',
    slug: 'attack-on-titan',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F36c156e0fafc.webp',
    status: 'Completed',
    rating: '5.0',
    displayChapters: '148 chapters',
    displayViews: '8.4M views',
    summary: 'Eren Yeager vows to eradicate every Titan after his mother is devoured, joining the Scout Regiment in humanity\'s fight for survival behind massive walls.',
    isHot: true,
  },
  {
    name: 'SPY x FAMILY',
    slug: 'spy-x-family',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F2735808fdf5a.webp',
    status: 'Ongoing',
    rating: '4.9',
    displayChapters: '278 chapters',
    displayViews: '3.9M views',
    summary: 'Master spy Twilight creates a faux family with telepathic orphan Anya and assassin Yor, unaware of each other\'s secret identities.',
    isHot: true,
  },
  {
    name: 'Berserk',
    slug: 'berserk',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F712f874bf1de.webp',
    status: 'Ongoing',
    rating: '5.0',
    displayChapters: '559 chapters',
    displayViews: '7.1M views',
    summary: 'Guts, the Black Swordsman, wields the Dragon Slayer in a dark fantasy realm to exact vengeance against Griffith and the demonic God Hand.',
    isHot: true,
  },
  {
    name: 'Bleach',
    slug: 'bleach',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F197948f2ac4d.webp',
    status: 'Completed',
    rating: '4.9',
    displayChapters: '728 chapters',
    displayViews: '6.2M views',
    summary: 'High school student Ichigo Kurosaki gains the powers of a Soul Reaper to defend humans against evil spirits and guide departed souls.',
    isHot: true,
  },
  {
    name: 'Naruto',
    slug: 'naruto',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F0b72878c8bcc.webp',
    status: 'Completed',
    rating: '4.9',
    displayChapters: '748 chapters',
    displayViews: '11.0M views',
    summary: 'Naruto Uzumaki, a young ninja carrying the Nine-Tailed Fox spirit, dreams of earning the respect of his village and becoming Hokage.',
    isHot: true,
  },
];

const AppHomeView = {
  heroItems: [],
  popularItems: [],
  spotlightList: [],
  heroIdx: 0,
  heroTimer: null,
  resumeTimeout: null,
  isInteracting: false,

  async render() {
    const root = document.getElementById('app-content');
    root.innerHTML = '<div class="app-loader"><div class="app-spinner"></div></div>';

    try {
      const data = await API.getHome().catch(() => ({}));
      const famousList = FAMOUS_MANGA_PRIORITY;
      const famousSlugs = new Set(famousList.map(m => m.slug));

      // 1. Spotlight Glass Cards: Strictly top famous manga
      this.spotlightList = famousList.slice(0, 8);

      // 2. Trending Shonen & Hits
      const rawTrending = (data && data.trendingItems) ? data.trendingItems : [];
      const trending = [
        ...famousList,
        ...rawTrending.filter(m => !famousSlugs.has(m.slug))
      ];

      // 3. Popular hits
      const rawPopular = (data && data.popularItems) ? data.popularItems : [];
      this.popularItems = [
        ...famousList.slice(4),
        ...rawPopular.filter(m => !famousSlugs.has(m.slug))
      ];

      const latest = Array.isArray(data?.latest) ? data.latest : (data?.latest?.items || []);
      const history = Store.getHistory();

      root.innerHTML = `
        <div class="app-page">
          <!-- Continuous Auto-Scrolling Glass Cards Spotlight (Demon Slayer, Dandadan, Silent Voice, Tokyo Revengers, One Piece, etc.) -->
          ${this.spotlightList.length > 0 ? this.renderSpotlightCarousel(this.spotlightList) : ''}

          <!-- Quick Action Bar -->
          <div class="app-quick-actions">
            <button class="btn-quick-pill" onclick="AppHomeView.rollSurprise()">
              <span class="quick-pill-icon">🎲</span>
              <span>Surprise Me</span>
            </button>
            <a href="#/search?genres=action,fantasy" class="btn-quick-pill">
              <span class="quick-pill-icon">⚔️</span>
              <span>Action & Shonen</span>
            </a>
            <a href="#/search?type=manhwa" class="btn-quick-pill">
              <span class="quick-pill-icon">⚡</span>
              <span>Top Manhwa</span>
            </a>
          </div>

          ${history.length > 0 ? this.renderContinue(history.slice(0, 6)) : ''}

          <!-- 🌟 All-Time Famous Manga & Legends (Rail #1) -->
          <div class="app-section">
            <div class="app-section-header">
              <h2 class="app-section-title">🌟 World Famous Manga</h2>
              <a href="#/search?sort=views_today" class="app-section-link">See All →</a>
            </div>
            <div class="app-rail">
              ${famousList.map((m, i) => this.card(m, { rank: i + 1 })).join('')}
            </div>
          </div>

          <!-- 🔥 Trending Action & Shonen -->
          <div class="app-section">
            <div class="app-section-header">
              <h2 class="app-section-title">🔥 Trending Hits</h2>
              <a href="#/search?sort=views_today" class="app-section-link">See All →</a>
            </div>
            <div class="app-rail">${trending.slice(0, 16).map((m, i) => this.card(m, { rank: i + 1 })).join('')}</div>
          </div>

          <!-- ⭐ Popular Series Grid -->
          <div class="app-section">
            <div class="app-section-header">
              <h2 class="app-section-title">⭐ Popular Series</h2>
              <a href="#/search?sort=views_today" class="app-section-link">More →</a>
            </div>
            <div class="app-grid">${this.popularItems.slice(0, 9).map(m => this.card(m)).join('')}</div>
          </div>

          ${latest.length > 0 ? `
          <div class="app-section">
            <div class="app-section-header">
              <h2 class="app-section-title">🕐 Latest Chapters</h2>
              <a href="#/latest" class="app-section-link">All →</a>
            </div>
            <div class="app-grid">${latest.slice(0, 12).map(m => this.card(m, { showChapter: true })).join('')}</div>
          </div>
          ` : ''}

          <!-- Credits Area -->
          <div class="app-credits-area">
            <div class="app-credits-card">
              <div class="app-credits-badge">✨ MangaFlow</div>
              <div class="app-credits-content">
                <span>Made with love by</span>
                <span class="app-credits-author">Neer Chan</span>
                <span class="app-credits-heart">❤</span>
              </div>
              <p class="app-credits-sub">Your high-definition manga & manhwa universe</p>
            </div>
          </div>
        </div>
      `;

      // Initialize Auto-Scroll Carousel
      this.initSpotlightCarousel();

    } catch (e) {
      console.error(e);
      root.innerHTML = `
        <div class="app-page app-empty">
          <h3>Failed to load</h3>
          <p>Check your server connection or local network.</p>
          <button class="btn-app-primary" onclick="AppHomeView.render()">Retry</button>
        </div>
      `;
    }
  },

  renderSpotlightCarousel(items) {
    if (!items || !items.length) return '';

    const cardsHtml = items.map((m, idx) => {
      const isSaved = Store.isBookmarked(m.slug);
      const coverUrl = API.resolveUrl(m.cover);
      const rating = m.rating || m.displayRating || '5.0';
      const chapters = m.displayChapters || (m.chaptersCount ? `${m.chaptersCount} Ch` : (m.latestChapters?.length ? `${m.latestChapters.length} Ch` : ''));
      const rawViews = m.displayViews || (m.stats?.views ? `${Math.round(m.stats.views / 1000)}K` : '');
      const views = rawViews ? String(rawViews).replace(/\s*views/gi, '') + ' views' : '';
      const badgeText = idx === 0 ? '⚡ SPOTLIGHT' : (idx === 1 ? '🔥 HOT #1' : (idx === 2 ? '⭐ MUST READ' : (idx === 3 ? '👑 LEGENDARY' : '✨ FEATURED')));
      const summary = m.summary ? this.escape(m.summary.replace(/\n+/g, ' ').slice(0, 95) + '...') : '';

      return `
        <div class="spotlight-glass-card" data-idx="${idx}" data-slug="${m.slug}">
          <!-- Ambient Glow Layer behind poster -->
          <div class="glass-ambient-glow" style="background-image:url('${coverUrl}')"></div>

          <!-- Card Inner Content -->
          <div class="glass-card-inner">
            <a href="#/manga/${m.slug}" class="glass-card-poster-link">
              <img class="glass-card-poster" src="${coverUrl}" alt="${this.escape(m.name)}" loading="${idx === 0 ? 'eager' : 'lazy'}" />
              <div class="glass-card-poster-shine"></div>
            </a>

            <div class="glass-card-info">
              <div class="glass-card-top-row">
                <span class="glass-badge ${idx === 0 ? 'spotlight' : (idx === 1 ? 'hot' : 'featured')}">${badgeText}</span>
                <span class="glass-rating">★ ${rating}</span>
              </div>

              <a href="#/manga/${m.slug}" class="glass-card-title-link">
                <h2 class="glass-card-title">${this.escape(m.name)}</h2>
              </a>

              <div class="glass-card-meta">
                ${chapters ? `<span class="meta-pill">${chapters}</span>` : ''}
                ${views ? `<span class="meta-pill">${views}</span>` : ''}
                ${m.status ? `<span class="meta-pill status-pill">${m.status}</span>` : ''}
              </div>

              ${summary ? `<p class="glass-card-summary">${summary}</p>` : ''}

              <div class="glass-card-actions">
                <a href="#/manga/${m.slug}" class="btn-glass-read">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  <span>Read</span>
                </a>
                <button class="btn-glass-bookmark ${isSaved ? 'active' : ''}" 
                        data-slug="${m.slug}" 
                        title="Bookmark"
                        onclick="AppHomeView.toggleCardBookmark('${m.slug}', event)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const dotsHtml = items.map((_, idx) => `
      <button class="spotlight-dot ${idx === 0 ? 'active' : ''}" 
              data-idx="${idx}" 
              aria-label="Go to slide ${idx + 1}"
              onclick="AppHomeView.goToSlide(${idx})">
      </button>
    `).join('');

    return `
      <div class="app-spotlight-section">
        <div class="app-spotlight-carousel-wrap">
          <div class="app-spotlight-track" id="spotlight-track">
            ${cardsHtml}
          </div>
        </div>
        <!-- Sleek Glass Pagination Dots -->
        <div class="spotlight-pagination" id="spotlight-dots">
          ${dotsHtml}
        </div>
      </div>
    `;
  },

  initSpotlightCarousel() {
    clearInterval(this.heroTimer);
    clearTimeout(this.resumeTimeout);
    const track = document.getElementById('spotlight-track');
    const dotsWrap = document.getElementById('spotlight-dots');
    if (!track || !this.spotlightList.length) return;

    const cards = track.querySelectorAll('.spotlight-glass-card');
    const dots = dotsWrap ? dotsWrap.querySelectorAll('.spotlight-dot') : [];
    if (!cards.length) return;

    this.heroIdx = 0;
    this.isInteracting = false;

    const updateActiveDot = (activeIdx) => {
      this.heroIdx = activeIdx;
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === activeIdx);
      });
    };

    // Real-time swipe tracking
    let scrollRaf = null;
    track.addEventListener('scroll', () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        const scrollLeft = track.scrollLeft;
        const cardWidth = cards[0].offsetWidth + 14; // including gap
        const currentIdx = Math.round(scrollLeft / cardWidth);
        const clampedIdx = Math.max(0, Math.min(currentIdx, cards.length - 1));
        if (clampedIdx !== this.heroIdx) {
          updateActiveDot(clampedIdx);
        }
      });
    }, { passive: true });

    // Touch / pointer interaction pause
    const onTouchStart = () => {
      this.isInteracting = true;
      clearInterval(this.heroTimer);
      clearTimeout(this.resumeTimeout);
    };

    const onTouchEnd = () => {
      clearTimeout(this.resumeTimeout);
      this.resumeTimeout = setTimeout(() => {
        this.isInteracting = false;
        startTimer();
      }, 4000);
    };

    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchend', onTouchEnd, { passive: true });
    track.addEventListener('pointerdown', onTouchStart, { passive: true });
    track.addEventListener('pointerup', onTouchEnd, { passive: true });

    // Auto-scrolling loop: continuously advances through the cards
    const startTimer = () => {
      clearInterval(this.heroTimer);
      if (cards.length <= 1) return;

      this.heroTimer = setInterval(() => {
        if (this.isInteracting) return;
        const nextIdx = (this.heroIdx + 1) % cards.length;
        this.goToSlide(nextIdx);
      }, 3800);
    };

    startTimer();
  },

  goToSlide(index) {
    const track = document.getElementById('spotlight-track');
    if (!track) return;
    const cards = track.querySelectorAll('.spotlight-glass-card');
    if (!cards[index]) return;

    const cardWidth = cards[0].offsetWidth + 14; // including gap
    track.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });

    this.heroIdx = index;
    const dotsWrap = document.getElementById('spotlight-dots');
    if (dotsWrap) {
      const dots = dotsWrap.querySelectorAll('.spotlight-dot');
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }
  },

  toggleCardBookmark(slug, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const item = [...this.spotlightList, ...this.popularItems].find(m => m.slug === slug);
    if (!item) return;

    const isSaved = Store.toggleBookmark(item);
    const btn = (event && event.currentTarget) || document.querySelector(`.btn-glass-bookmark[data-slug="${slug}"]`);
    if (btn) {
      btn.classList.toggle('active', isSaved);
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', isSaved ? 'currentColor' : 'none');
    }

    if (window.Haptics) window.Haptics.light();
    if (window.App?.showToast) {
      window.App.showToast(isSaved ? `⭐ Added "${item.name}" to Library` : `Removed from Library`);
    }
  },

  renderContinue(items) {
    return `
      <div class="app-section">
        <div class="app-section-header">
          <h2 class="app-section-title">▶ Continue Reading</h2>
          <a href="#/library" class="app-section-link">History →</a>
        </div>
        <div class="app-rail">
          ${items.map(h => `
            <a href="#/read/${h.mangaSlug}/${h.chapterSlug}" class="app-continue-card">
              <img src="${API.resolveUrl(h.cover || '')}" alt="${this.escape(h.mangaName)}" class="app-continue-thumb" />
              <div class="app-continue-info">
                <div class="app-continue-title">${this.escape(h.mangaName)}</div>
                <div class="app-continue-ch">${this.escape(h.chapterName)}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  },

  card(m, opts = {}) {
    const ch = opts.showChapter ? (m.latestChapters?.[0]?.name || m.displayChapters || '') : '';
    const unread = Store.getUnreadCount(m.slug, m.displayChapters || m.latestChapters?.length || 0);

    return `
      <a href="#/manga/${m.slug}" class="app-card">
        <div class="app-card-poster-wrap">
          ${opts.rank ? `<span class="app-card-rank r-${opts.rank}">${opts.rank}</span>` : ''}
          <img class="app-card-poster" src="${API.resolveUrl(m.cover)}" alt="${this.escape(m.name)}" loading="lazy" />
          <div class="app-card-gradient"></div>
          ${ch ? `<span class="app-card-ch">${this.escape(ch)}</span>` : ''}
          ${unread > 0 ? `<span class="app-card-unread-badge">+${unread} NEW</span>` : ''}
        </div>
        <div class="app-card-title">${this.escape(m.name)}</div>
        <div class="app-card-meta">
          <span class="gold">★ ${m.rating || '5.0'}</span>
        </div>
      </a>
    `;
  },

  rollSurprise() {
    if (window.Haptics) window.Haptics.light();
    const pool = [...this.spotlightList, ...this.popularItems];
    if (!pool.length) return;

    const randomChoice = pool[Math.floor(Math.random() * pool.length)];
    if (window.App?.showToast) {
      window.App.showToast(`🎲 Opening: ${randomChoice.name}`);
    }
    window.location.hash = `#/manga/${randomChoice.slug}`;
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
};

window.AppHomeView = AppHomeView;
