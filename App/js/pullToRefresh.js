// ==========================================================================
// MangaFlow App — Native Pull-to-Refresh Engine
// ==========================================================================

const PullToRefresh = {
  startY: 0,
  currentY: 0,
  isPulling: false,
  isRefreshing: false,
  threshold: 70,
  indicatorEl: null,

  init(onRefreshCallback) {
    this.callback = onRefreshCallback;
    this.createIndicator();
    this.bindEvents();
  },

  createIndicator() {
    if (this.indicatorEl) return;
    const el = document.createElement('div');
    el.id = 'ptr-indicator';
    el.className = 'ptr-indicator';
    el.innerHTML = `
      <div class="ptr-spinner-wrap">
        <svg class="ptr-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
        <div class="ptr-spinner"></div>
      </div>
      <span class="ptr-text">Pull to refresh</span>
    `;
    document.body.appendChild(el);
    this.indicatorEl = el;
  },

  bindEvents() {
    document.addEventListener('touchstart', (e) => {
      if (this.isRefreshing) return;
      // Only initiate if at top of page and not in reader mode
      if (window.scrollY <= 2 && !location.hash.startsWith('#/read/')) {
        this.startY = e.touches[0].clientY;
        this.isPulling = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!this.isPulling || this.isRefreshing) return;
      this.currentY = e.touches[0].clientY;
      const diff = this.currentY - this.startY;

      if (diff > 0 && window.scrollY <= 2) {
        const pullDist = Math.min(diff * 0.45, 110);
        this.indicatorEl.style.transform = `translateY(${pullDist}px)`;
        this.indicatorEl.classList.add('visible');

        const arrow = this.indicatorEl.querySelector('.ptr-arrow');
        const text = this.indicatorEl.querySelector('.ptr-text');

        if (pullDist >= this.threshold) {
          this.indicatorEl.classList.add('ready');
          if (arrow) arrow.style.transform = 'rotate(180deg)';
          if (text) text.textContent = 'Release to refresh';
        } else {
          this.indicatorEl.classList.remove('ready');
          if (arrow) arrow.style.transform = 'rotate(0deg)';
          if (text) text.textContent = 'Pull to refresh';
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', async () => {
      if (!this.isPulling) return;
      this.isPulling = false;
      const diff = this.currentY - this.startY;
      const pullDist = Math.min(diff * 0.45, 110);

      if (pullDist >= this.threshold && !this.isRefreshing) {
        this.isRefreshing = true;
        this.indicatorEl.classList.add('refreshing');
        this.indicatorEl.style.transform = `translateY(${this.threshold}px)`;
        if (window.Haptics) window.Haptics.medium();

        try {
          if (window.Router?.handleRoute) {
            await window.Router.handleRoute();
          }
        } catch (e) {
          console.warn('PTR reload error:', e);
        }

        setTimeout(() => {
          this.reset();
        }, 600);
      } else {
        this.reset();
      }
    }, { passive: true });
  },

  reset() {
    if (!this.indicatorEl) return;
    this.indicatorEl.style.transform = 'translateY(0)';
    this.indicatorEl.classList.remove('visible', 'ready', 'refreshing');
    this.isRefreshing = false;
    this.startY = 0;
    this.currentY = 0;
  }
};

window.PullToRefresh = PullToRefresh;
