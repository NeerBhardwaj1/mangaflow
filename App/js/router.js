// ==========================================================================
// MangaFlow App — SPA Router
// ==========================================================================

const Router = {
  routes: {},

  register(pattern, handler) {
    this.routes[pattern] = handler;
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  resolve() {
    const hash = location.hash.slice(1) || '/';
    const [path, queryStr] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(queryStr || ''));

    // Update active tab in mnavbar
    document.querySelectorAll('.mnavbar-tab, .tab-item').forEach(t => {
      const tab = t.dataset.tab;
      const isActive = (tab === 'home' && (path === '/' || path === '')) || (tab && path.startsWith('/' + tab));
      t.classList.toggle('active', !!isActive);
    });

    // Handle Reader immersive mode (hide top & bottom navigation)
    const isReader = path.startsWith('/read/');
    const header = document.getElementById('app-header');
    const tabs = document.getElementById('app-tabs');
    const tabsWrap = document.getElementById('app-tabs-wrap');
    const content = document.getElementById('app-content');

    if (header) {
      header.classList.toggle('hidden', isReader);
    }
    if (tabs) {
      tabs.style.display = isReader ? 'none' : '';
    }
    if (tabsWrap) {
      tabsWrap.classList.toggle('hidden', isReader);
    }
    if (content) {
      content.style.paddingTop = isReader ? '0' : '';
      content.style.paddingBottom = isReader ? '0' : '';
    }
    if (!isReader && window.AndroidNative?.setImmersiveMode) {
      window.AndroidNative.setImmersiveMode(false);
    }

    // Route matching
    if (path === '/' || path === '') return AppHomeView.render();
    if (path === '/latest') return AppLatestView.render(params.page || 1);
    if (path === '/search') return AppSearchView.render(params);
    if (path === '/library') return AppLibraryView.render(params);

    // /manga/:slug
    const mangaMatch = path.match(/^\/manga\/(.+)/);
    if (mangaMatch) return AppDetailView.render(mangaMatch[1]);

    // /read/:mangaSlug/:chapterSlug
    const readMatch = path.match(/^\/read\/([^/]+)\/(.+)/);
    if (readMatch) return AppReaderView.render(readMatch[1], readMatch[2]);

    // Fallback
    AppHomeView.render();
  },
};

window.Router = Router;
