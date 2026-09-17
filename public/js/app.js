// ==========================================================================
// MangaFlow Main App Bootstrap
// ==========================================================================

const App = {
  searchDebounce: null,
  toastTimeout: null,

  init() {
    this.bindHeaderScroll();
    this.bindQuickSearch();
    this.bindMobileDrawer();
    this.bindKeyboardShortcuts();

    // Update library badge indicator
    Store.updateBadge();

    // Start Router
    Router.init();

    // Auto-check for app updates
    if (window.AppUpdater) {
      AppUpdater.init();
    }
  },

  bindHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  },

  bindQuickSearch() {
    const input = document.getElementById('quick-search-input');
    const dropdown = document.getElementById('quick-search-dropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearTimeout(this.searchDebounce);

      if (!q) {
        dropdown.style.display = 'none';
        return;
      }

      this.searchDebounce = setTimeout(async () => {
        try {
          const data = await API.search({ q, limit: 5 });
          const items = (data.items || []).slice(0, 5);

          if (items.length === 0) {
            dropdown.innerHTML = `<div style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No manga found for "${this.escapeHtml(q)}"</div>`;
            dropdown.style.display = 'block';
            return;
          }

          dropdown.innerHTML = items.map((item, idx) => `
            <a href="#/manga/${item.slug}" class="quick-search-item" onclick="document.getElementById('quick-search-dropdown').style.display='none'">
              <img class="quick-search-thumb" src="${item.cover}" alt="${this.escapeHtml(item.name)}" />
              <div class="quick-search-info">
                <h4 class="quick-search-title">${this.escapeHtml(item.name)}</h4>
                <div class="quick-search-sub">
                  ${idx === 0 ? '<span style="color: var(--accent-light); font-weight: 700;">★ Best Match</span>' : `<span>★ ${item.rating || '5.0'}</span>`}
                  ${item.status ? `<span>• ${item.status}</span>` : ''}
                </div>
              </div>
            </a>
          `).join('') + `
            <div style="padding: 10px; border-top: 1px solid var(--border-subtle); text-align: center;">
              <a href="#/search?q=${encodeURIComponent(q)}" class="text-xs" style="color: var(--accent-light); font-weight: 600;" onclick="document.getElementById('quick-search-dropdown').style.display='none'">
                View all results for "${this.escapeHtml(q)}" →
              </a>
            </div>
          `;
          dropdown.style.display = 'block';
        } catch (e) {
          dropdown.style.display = 'none';
        }
      }, 300);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) {
          dropdown.style.display = 'none';
          window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
        }
      } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
      }
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        dropdown.style.display = 'none';
      }
    });
  },

  bindMobileDrawer() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('drawer-close-btn');
    const drawer = document.getElementById('mobile-drawer');

    if (!menuBtn || !drawer) return;

    menuBtn.addEventListener('click', () => {
      drawer.classList.add('active');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        drawer.classList.remove('active');
      });
    }

    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        drawer.classList.remove('active');
      }
    });

    const links = drawer.querySelectorAll('.drawer-link');
    links.forEach((l) => {
      l.addEventListener('click', () => {
        drawer.classList.remove('active');
      });
    });
  },

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K opens search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('quick-search-input');
        if (input) {
          input.focus();
          input.select();
        }
      }
    });
  },

  showToast(message) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-message');
    if (!toast || !msg) return;

    msg.textContent = message;
    toast.style.display = 'block';

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 2800);
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

window.App = App;

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
