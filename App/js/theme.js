// ==========================================================================
// MangaFlow App — Theme Engine
// ==========================================================================

const ThemeManager = {
  THEMES: {
    cyberpunk: {
      name: 'Cyberpunk Neon',
      emoji: '🟣',
      primary: '#6366f1',
      secondary: '#ec4899',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
      glow: 'rgba(99, 102, 241, 0.35)',
      cardBorder: 'rgba(99, 102, 241, 0.25)'
    },
    sakura: {
      name: 'Sakura Bloom',
      emoji: '🌸',
      primary: '#f43f5e',
      secondary: '#f472b6',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #f472b6 100%)',
      glow: 'rgba(244, 63, 94, 0.35)',
      cardBorder: 'rgba(244, 63, 94, 0.25)'
    },
    azure: {
      name: 'Electric Azure',
      emoji: '🔵',
      primary: '#0284c7',
      secondary: '#06b6d4',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
      glow: 'rgba(6, 182, 212, 0.35)',
      cardBorder: 'rgba(6, 182, 212, 0.25)'
    },
    emerald: {
      name: 'Emerald Matrix',
      emoji: '🟢',
      primary: '#059669',
      secondary: '#10b981',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      glow: 'rgba(16, 185, 129, 0.35)',
      cardBorder: 'rgba(16, 185, 129, 0.25)'
    },
    crimson: {
      name: 'Crimson Blade',
      emoji: '🔴',
      primary: '#dc2626',
      secondary: '#f97316',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
      glow: 'rgba(220, 38, 38, 0.35)',
      cardBorder: 'rgba(220, 38, 38, 0.25)'
    }
  },

  currentTheme: 'cyberpunk',

  init() {
    const saved = localStorage.getItem('mf_theme') || 'cyberpunk';
    this.setTheme(saved, false);
  },

  setTheme(themeKey, notify = true) {
    if (!this.THEMES[themeKey]) themeKey = 'cyberpunk';
    this.currentTheme = themeKey;
    localStorage.setItem('mf_theme', themeKey);

    const t = this.THEMES[themeKey];
    const root = document.documentElement;

    root.style.setProperty('--accent-primary', t.primary);
    root.style.setProperty('--accent-secondary', t.secondary);
    root.style.setProperty('--accent-gradient', t.gradient);
    root.style.setProperty('--glow-brand', t.glow);
    root.style.setProperty('--border-focus', t.cardBorder);

    document.querySelectorAll('[data-theme-key]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-theme-key') === themeKey);
    });

    if (notify && window.App?.showToast) {
      window.App.showToast(`Theme changed to ${t.emoji} ${t.name}`);
      window.Haptics?.light();
    }
  },

  openThemeModal() {
    let modal = document.getElementById('theme-picker-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'theme-picker-modal';
      modal.className = 'app-modal-backdrop';
      modal.innerHTML = `
        <div class="app-modal-sheet">
          <div class="modal-drag-pill"></div>
          <div class="modal-header">
            <h3>🎨 Neon Theme Palettes</h3>
            <button class="modal-close-btn" id="theme-modal-close">✕</button>
          </div>
          <p class="modal-desc">Choose your favorite neon accent glow style across MangaFlow.</p>
          <div class="theme-options-grid">
            ${Object.entries(this.THEMES).map(([k, t]) => `
              <button class="theme-option-card ${this.currentTheme === k ? 'active' : ''}" data-theme-key="${k}">
                <div class="theme-swatch" style="background:${t.gradient}"></div>
                <div class="theme-info">
                  <span class="theme-title">${t.emoji} ${t.name}</span>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#theme-modal-close')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });

      modal.querySelectorAll('.theme-option-card').forEach(card => {
        card.addEventListener('click', () => {
          const key = card.getAttribute('data-theme-key');
          this.setTheme(key);
          modal.style.display = 'none';
        });
      });
    }
    modal.querySelectorAll('.theme-option-card').forEach(card => {
      const key = card.getAttribute('data-theme-key');
      card.classList.toggle('active', this.currentTheme === key);
    });
    modal.style.display = 'flex';
  }
};

ThemeManager.init();
window.ThemeManager = ThemeManager;
