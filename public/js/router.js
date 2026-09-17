// ==========================================================================
// MangaFlow Client-Side SPA Router
// ==========================================================================

const Router = {
  currentRoute: '',

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  handleRoute() {
    const rawHash = window.location.hash.slice(1) || '/';
    const [pathPart, queryPart] = rawHash.split('?');
    const path = pathPart.replace(/\/$/, '') || '/';
    
    // Parse query params
    const queryParams = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      for (const [k, v] of searchParams.entries()) {
        queryParams[k] = v;
      }
    }

    // Restore main site header if leaving reader
    if (!path.startsWith('/read/')) {
      if (window.ReaderView && typeof window.ReaderView.cleanup === 'function') {
        window.ReaderView.cleanup();
      }
      const header = document.getElementById('main-header');
      if (header) header.style.display = 'block';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Update active nav link
    this.updateActiveNav(path);

    // Route matching
    if (path === '/' || path === '') {
      HomeView.render();
    } else if (path === '/latest') {
      LatestView.render(queryParams.page || 1);
    } else if (path.startsWith('/manga/')) {
      const slug = path.replace('/manga/', '');
      DetailView.render(slug);
    } else if (path.startsWith('/read/')) {
      const parts = path.replace('/read/', '').split('/');
      const mangaSlug = parts[0];
      const chapterSlug = parts[1];
      ReaderView.render(mangaSlug, chapterSlug);
    } else if (path === '/search') {
      SearchView.render(queryParams);
    } else if (path === '/ranking') {
      RankingView.render(queryParams.type || 'manga');
    } else if (path === '/genres') {
      GenresView.render();
    } else if (path === '/library') {
      LibraryView.render(queryParams.tab || 'bookmarks');
    } else if (path === '/settings') {
      if (window.AppSettingsView) AppSettingsView.render();
    } else {
      // Fallback to home
      HomeView.render();
    }
  },

  updateActiveNav(path) {
    const links = document.querySelectorAll('.desktop-nav .nav-link, .drawer-link');
    links.forEach((l) => {
      const route = l.getAttribute('data-route');
      if (!route) return;

      if (
        (route === 'home' && path === '/') ||
        (route === 'latest' && path === '/latest') ||
        (route === 'search' && path === '/search') ||
        (route === 'ranking' && path === '/ranking') ||
        (route === 'genres' && path === '/genres') ||
        (route === 'library' && path === '/library')
      ) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });
  },
};

window.Router = Router;
