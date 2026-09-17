// ==========================================================================
// MangaFlow App — Main App Bootstrap with Android Back & Gestures
// ==========================================================================

const App = {
  searchDebounce: null,
  toastTimeout: null,

  async init() {
    // 0. Detect mobile/native platform
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
      (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
      location.protocol === 'capacitor:' || location.protocol === 'file:';
    if (isMobile) {
      document.documentElement.classList.add('is-mobile-device', 'is-native-app');
    }

    // 0b. Detect server (local dev vs cloud Render)
    await API.detectFastestServer();

    // 1. Initialize Store Badge
    Store.updateBadge();

    // 2. Setup Search Overlay
    this.setupSearchOverlay();

    // 3. Setup Server Connection Modal
    this.setupServerModal();

    // 4. Setup Header Quick Actions (Dice & Search)
    this.setupHeaderQuickActions();

    // 5. Setup Tab Haptics
    this.setupTabsHaptics();

    // 6. Setup Pull To Refresh
    if (window.PullToRefresh) {
      window.PullToRefresh.init();
    }

    // 7. Register Service Worker (web environment)
    this.registerSW();

    // 8. Start Router
    Router.init();

    // 9. Initialize In-App Update Engine
    if (window.AppUpdater) {
      AppUpdater.init();
    }
  },

  handleBackButton() {
    // 1. Check search overlay
    const searchOverlay = document.getElementById('search-overlay');
    if (searchOverlay && (searchOverlay.classList.contains('active') || searchOverlay.style.display === 'flex')) {
      searchOverlay.classList.remove('active');
      searchOverlay.style.display = '';
      const inp = searchOverlay.querySelector('input');
      if (inp) inp.blur();
      if (window.Haptics) window.Haptics.light();
      return true;
    }

    // 2. Check open modals/sheets
    const modals = [
      document.getElementById('reader-settings-sheet'),
      document.getElementById('advanced-filter-modal'),
      document.getElementById('shelf-picker-modal'),
      document.getElementById('theme-picker-modal'),
      document.getElementById('server-modal'),
      document.getElementById('app-update-modal')
    ];

    for (const m of modals) {
      if (m && (m.style.display === 'flex' || m.classList.contains('active'))) {
        m.style.display = 'none';
        m.classList.remove('active');
        if (window.Haptics) window.Haptics.light();
        return true;
      }
    }

    // 2. Check reader view
    if (location.hash.startsWith('#/read/')) {
      if (window.AppReaderView && window.AppReaderView.mangaSlug) {
        window.AppReaderView.cleanupImmersive();
        location.hash = `#/manga/${window.AppReaderView.mangaSlug}`;
      } else {
        window.history.back();
      }
      return true;
    }

    // 3. Check manga details or search subviews
    if (location.hash.startsWith('#/manga/')) {
      location.hash = '#/';
      return true;
    }

    // 4. If on other tabs (Updates, Browse, Library), return to Home
    if (location.hash && location.hash !== '#/' && location.hash !== '#') {
      location.hash = '#/';
      return true;
    }

    // 5. Already on Home -> return false to let Android show "Press back again to exit"
    return false;
  },

  setupHeaderQuickActions() {
    const diceBtn = document.getElementById('header-dice-btn');
    diceBtn?.addEventListener('click', () => {
      const dice = diceBtn.querySelector('.dice-emoji');
      if (dice) {
        dice.style.transform = 'rotate(360deg) scale(1.25)';
        setTimeout(() => { dice.style.transform = ''; }, 380);
      }
      if (window.AppHomeView?.rollSurprise) {
        window.AppHomeView.rollSurprise();
      }
    });

    const brandHome = document.getElementById('header-brand-home');
    brandHome?.addEventListener('click', (e) => {
      if (window.Haptics) window.Haptics.light();
      if (!location.hash || location.hash === '#/' || location.hash === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    const settingsBtn = document.getElementById('header-settings-btn');
    if (settingsBtn) {
      const openSettings = (e) => {
        e.preventDefault();
        if (window.Haptics) window.Haptics.light();
        if (location.hash === '#/settings') {
          Router.resolve();
        } else {
          location.hash = '#/settings';
        }
      };
      settingsBtn.addEventListener('click', openSettings);
    }
  },

  setupTabsHaptics() {
    document.querySelectorAll('.app-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (window.Haptics) window.Haptics.light();
      });
    });
  },

  setupServerModal() {
    const modal = document.getElementById('server-modal');
    const closeBtn = document.getElementById('server-modal-close');
    const input = document.getElementById('server-url-input');
    const testBtn = document.getElementById('btn-test-server');
    const saveBtn = document.getElementById('btn-save-server');
    const resultEl = document.getElementById('server-test-result');

    const btnLan = document.getElementById('btn-quick-lan');
    const btnLocal = document.getElementById('btn-quick-local');
    const btnEmu = document.getElementById('btn-quick-emulator');

    if (!modal) return;

    window.openServerModal = () => {
      if (input) input.value = API.getBaseUrl() || API.DEFAULT_LAN_HOST;
      if (resultEl) resultEl.innerHTML = '';
      modal.style.display = 'flex';
      if (window.Haptics) window.Haptics.light();
    };

    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-open-server-modal')) {
        window.openServerModal();
      }
    });

    closeBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    btnLan?.addEventListener('click', () => {
      if (input) input.value = API.DEFAULT_LAN_HOST;
    });

    btnLocal?.addEventListener('click', () => {
      if (input) input.value = 'http://localhost:3000';
    });

    btnEmu?.addEventListener('click', () => {
      if (input) input.value = 'http://10.0.2.2:3000';
    });

    testBtn?.addEventListener('click', async () => {
      const url = (input ? input.value : '').trim();
      if (resultEl) {
        resultEl.innerHTML = '<span style="color:var(--accent-light);">Pinging server...</span>';
      }
      const res = await API.pingServer(url);
      if (resultEl) {
        if (res.ok) {
          resultEl.innerHTML = `<span style="color:var(--accent-emerald);">Connected! Latency: ${res.latency}ms</span>`;
          if (window.Haptics) window.Haptics.success();
        } else {
          resultEl.innerHTML = `<span style="color:#ef4444;">Failed: ${res.error}</span>`;
          if (window.Haptics) window.Haptics.heavy();
        }
      }
    });

    saveBtn?.addEventListener('click', () => {
      const url = (input ? input.value : '').trim();
      API.setBaseUrl(url);
      modal.style.display = 'none';
      this.showToast('Server URL updated');
      if (window.Haptics) window.Haptics.success();
      Router.resolve();
    });
  },

  setupSearchOverlay() {
    const searchBtn = document.getElementById('header-search-btn');
    const overlay = document.getElementById('search-overlay');
    const closeBtn = document.getElementById('search-overlay-close');
    const input = document.getElementById('search-overlay-input');
    const clearBtn = document.getElementById('search-overlay-clear');
    const results = document.getElementById('search-overlay-results');

    if (!searchBtn || !overlay) return;

    searchBtn.addEventListener('click', () => {
      overlay.style.display = '';
      overlay.classList.add('active');
      if (window.Haptics) window.Haptics.light();
      setTimeout(() => input?.focus(), 150);
    });

    closeBtn?.addEventListener('click', () => {
      overlay.classList.remove('active');
      overlay.style.display = '';
      if (input) {
        input.value = '';
        input.blur();
      }
      if (clearBtn) clearBtn.style.display = 'none';
      if (results) results.innerHTML = '';
    });

    clearBtn?.addEventListener('click', () => {
      if (input) {
        input.value = '';
        input.focus();
      }
      clearBtn.style.display = 'none';
      if (results) results.innerHTML = '';
      if (window.Haptics) window.Haptics.light();
    });

    input?.addEventListener('input', () => {
      clearTimeout(this.searchDebounce);
      const query = input.value.trim();

      if (clearBtn) {
        clearBtn.style.display = query ? 'flex' : 'none';
      }

      if (!query) {
        results.innerHTML = '';
        return;
      }

      this.searchDebounce = setTimeout(async () => {
        results.innerHTML = '<div class="app-loader" style="min-height: 120px;"><div class="app-spinner"></div></div>';
        try {
          const res = await API.search(query, 1);
          const items = (res.items || []).slice(0, 10);

          if (!items.length) {
            results.innerHTML = '<div class="app-empty" style="padding: 30px 10px;"><p>No manga found matching "' + this.escape(query) + '"</p></div>';
            return;
          }

          results.innerHTML = items.map((m, idx) => `
            <a href="#/manga/${m.slug}" class="search-result-item" onclick="document.getElementById('search-overlay').classList.remove('active')">
              <img src="${API.resolveUrl(m.cover)}" alt="${this.escape(m.name)}" class="search-result-thumb" loading="lazy" />
              <div class="search-result-info">
                ${idx === 0 ? '<span class="search-result-badge">★ BEST MATCH</span>' : ''}
                <div class="search-result-title">${this.escape(m.name)}</div>
                <div class="search-result-meta">
                  ${m.status ? `<span style="text-transform:capitalize;">${m.status}</span> • ` : ''}
                  ★ ${m.rating || '5.0'}
                </div>
              </div>
            </a>
          `).join('');
        } catch (err) {
          console.error(err);
          results.innerHTML = '<div class="app-empty" style="padding: 20px;"><p>Search failed</p></div>';
        }
      }, 250);
    });
  },

  showToast(msg) {
    const toast = document.getElementById('app-toast');
    const msgEl = document.getElementById('app-toast-msg');
    if (!toast || !msgEl) return;

    msgEl.textContent = msg;
    toast.style.display = 'block';

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 2500);
  },

  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (let r of regs) r.unregister();
      });
    }
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
