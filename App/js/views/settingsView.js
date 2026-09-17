// ==========================================================================
// MangaFlow App — Settings View
// ==========================================================================

const AppSettingsView = {
  activeCheckPromise: null,

  async render() {
    const root = document.getElementById('app-content');
    if (!root) return;

    window.scrollTo({ top: 0, behavior: 'instant' });

    const currentVersion = AppUpdater.CURRENT_VERSION;
    const currentBuild = AppUpdater.CURRENT_VERSION_CODE;
    const autoCheck = localStorage.getItem('mf_auto_check_updates') !== 'false';
    const readingMode = localStorage.getItem('mf_reader_mode') || 'webtoon';
    const qualityMode = localStorage.getItem('mf_reader_quality') || 'high';
    const currentServer = API.getBaseUrl() || 'http://localhost:3000';
    const currentTheme = ThemeManager.currentTheme || 'cyberpunk';

    root.innerHTML = `
      <div class="app-page app-settings-page">
        <!-- Settings Top Header -->
        <div class="app-settings-header">
          <button class="app-btn-back" onclick="history.back()" aria-label="Go Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Back</span>
          </button>
          <h1 class="app-settings-title">Settings</h1>
          <div style="width: 50px;"></div>
        </div>

        <div class="app-settings-container">

          <!-- 1. App Updates Section -->
          <div class="settings-section">
            <div class="settings-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
              <span>App Updates</span>
            </div>

            <div class="settings-card update-card">
              <div class="update-card-top">
                <div class="update-card-info">
                  <div class="update-app-name">MangaFlow PRO</div>
                  <div class="update-app-ver">Version ${currentVersion} <span class="build-tag">Build ${currentBuild}</span></div>
                </div>
                <div id="settings-update-status-badge" class="update-status-pill up-to-date">
                  <span class="status-dot"></span>
                  <span id="settings-status-text">Up to date</span>
                </div>
              </div>

              <div class="update-card-actions">
                <button class="btn-settings-primary" id="btn-manual-check-update" onclick="AppSettingsView.handleManualCheck()">
                  <svg id="icon-update-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                  <span id="btn-update-text">Check for Updates</span>
                </button>
              </div>

              <div class="settings-row border-top">
                <div class="settings-row-text">
                  <div class="settings-row-label">Auto-check on Launch</div>
                  <div class="settings-row-sub">Notify automatically when a new version is released</div>
                </div>
                <label class="settings-switch">
                  <input type="checkbox" id="toggle-auto-check" ${autoCheck ? 'checked' : ''} onchange="AppSettingsView.toggleAutoCheck(this.checked)" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- 2. Appearance & Themes -->
          <div class="settings-section">
            <div class="settings-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24"></path><path d="m14.83 9.17 4.24-4.24"></path><path d="m14.83 14.83 4.24 4.24"></path><path d="m9.17 14.83-4.24 4.24"></path></svg>
              <span>Appearance & Color Theme</span>
            </div>

            <div class="settings-card">
              <div class="theme-picker-grid">
                ${Object.entries(ThemeManager.THEMES).map(([key, t]) => `
                  <button class="theme-choice-btn ${key === currentTheme ? 'active' : ''}" 
                          data-theme-key="${key}"
                          onclick="AppSettingsView.selectTheme('${key}')">
                    <div class="theme-choice-circle" style="background: ${t.gradient};">
                      ${key === currentTheme ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                    </div>
                    <div class="theme-choice-name">${t.emoji} ${t.name}</div>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- 3. Reader Preferences -->
          <div class="settings-section">
            <div class="settings-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              <span>Reader Settings</span>
            </div>

            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-row-text">
                  <div class="settings-row-label">Default Reading Mode</div>
                  <div class="settings-row-sub">Choose how chapters are displayed</div>
                </div>
                <select class="settings-select" id="pref-reading-mode" onchange="AppSettingsView.setReadingMode(this.value)">
                  <option value="webtoon" ${readingMode === 'webtoon' ? 'selected' : ''}>Vertical Webtoon</option>
                  <option value="paged-ltr" ${readingMode === 'paged-ltr' ? 'selected' : ''}>Paged (Left to Right)</option>
                  <option value="paged-rtl" ${readingMode === 'paged-rtl' ? 'selected' : ''}>Manga (Right to Left)</option>
                </select>
              </div>

              <div class="settings-row border-top">
                <div class="settings-row-text">
                  <div class="settings-row-label">Image Quality</div>
                  <div class="settings-row-sub">High resolution vs bandwidth saver</div>
                </div>
                <select class="settings-select" id="pref-image-quality" onchange="AppSettingsView.setImageQuality(this.value)">
                  <option value="high" ${qualityMode === 'high' ? 'selected' : ''}>High Quality (HD)</option>
                  <option value="compressed" ${qualityMode === 'compressed' ? 'selected' : ''}>Data Saver</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 4. Storage & Offline -->
          <div class="settings-section">
            <div class="settings-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Storage & Downloads</span>
            </div>

            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-row-text">
                  <div class="settings-row-label">Offline Chapters</div>
                  <div class="settings-row-sub">View and manage saved chapters</div>
                </div>
                <a href="#/library" class="btn-settings-sm">Manage</a>
              </div>

              <div class="settings-row border-top">
                <div class="settings-row-text">
                  <div class="settings-row-label">Clear Temporary Cache</div>
                  <div class="settings-row-sub">Cleans local reading thumbnails and search cache</div>
                </div>
                <button class="btn-settings-sm danger" onclick="AppSettingsView.clearCache()">Clear</button>
              </div>
            </div>
          </div>

          <!-- 5. Network & Server -->
          <div class="settings-section">
            <div class="settings-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              <span>Backend Connection</span>
            </div>

            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-row-text">
                  <div class="settings-row-label">Active API Host</div>
                  <div class="settings-row-sub mono" id="settings-current-host">${this.escape(currentServer)}</div>
                </div>
                <button class="btn-settings-sm" onclick="App.setupServerModal(); document.getElementById('server-modal').style.display='flex';">Configure</button>
              </div>
            </div>
          </div>

          <!-- 6. About MangaFlow -->
          <div class="settings-section">
            <div class="settings-card about-card">
              <div class="about-logo-wrap">
                <img src="./images/logo.png" alt="MangaFlow" class="about-logo" />
              </div>
              <div class="about-title">MangaFlow PRO</div>
              <div class="about-version">v${currentVersion} • Mobile Edition</div>
              <div class="about-credits">
                <span class="heart">❤</span> Handcrafted with love by <strong>Neer Chan</strong>
              </div>
              <div class="about-desc">
                Fast, responsive and beautiful manga reader with full offline support and instant library sync.
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    // Check update status to reflect on badge
    this.refreshUpdateStatus();
  },

  async refreshUpdateStatus() {
    try {
      const baseUrl = API.getBaseUrl();
      const res = await fetch(`${baseUrl}/api/app/version?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const isNewer = (data.versionCode > AppUpdater.CURRENT_VERSION_CODE) || 
                        (AppUpdater.compareSemver(data.version, AppUpdater.CURRENT_VERSION) > 0);
        const badge = document.getElementById('settings-update-status-badge');
        const text = document.getElementById('settings-status-text');
        if (badge && text) {
          if (isNewer) {
            badge.className = 'update-status-pill update-ready';
            text.textContent = `Update Ready (v${data.version})`;
          } else {
            badge.className = 'update-status-pill up-to-date';
            text.textContent = 'Up to date';
          }
        }
      }
    } catch (e) {}
  },

  async handleManualCheck() {
    const btn = document.getElementById('btn-manual-check-update');
    const icon = document.getElementById('icon-update-check');
    const text = document.getElementById('btn-update-text');

    if (btn) btn.disabled = true;
    if (icon) icon.classList.add('spin-animation');
    if (text) text.textContent = 'Checking server...';

    if (window.Haptics) window.Haptics.light();

    try {
      const res = await AppUpdater.checkForUpdates({ silent: false });
      const badge = document.getElementById('settings-update-status-badge');
      const statusText = document.getElementById('settings-status-text');
      if (badge && statusText) {
        if (res.updateAvailable) {
          badge.className = 'update-status-pill update-ready';
          statusText.textContent = `Update Ready (v${res.data.version})`;
        } else {
          badge.className = 'update-status-pill up-to-date';
          statusText.textContent = 'Up to date';
        }
      }
    } finally {
      if (btn) btn.disabled = false;
      if (icon) icon.classList.remove('spin-animation');
      if (text) text.textContent = 'Check for Updates';
    }
  },

  toggleAutoCheck(checked) {
    localStorage.setItem('mf_auto_check_updates', checked ? 'true' : 'false');
    if (window.Haptics) window.Haptics.light();
    if (window.App?.showToast) {
      window.App.showToast(checked ? '✓ Auto-check updates enabled' : 'Auto-check updates disabled');
    }
  },

  selectTheme(key) {
    ThemeManager.setTheme(key, true);
    document.querySelectorAll('.theme-choice-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-theme-key') === key;
      btn.classList.toggle('active', isActive);
      const circle = btn.querySelector('.theme-choice-circle');
      if (circle) {
        circle.innerHTML = isActive ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>` : '';
      }
    });
    if (window.Haptics) window.Haptics.light();
  },

  setReadingMode(mode) {
    localStorage.setItem('mf_reader_mode', mode);
    if (window.Haptics) window.Haptics.light();
    if (window.App?.showToast) {
      window.App.showToast(`Reading mode set to ${mode === 'webtoon' ? 'Vertical Webtoon' : (mode === 'paged-rtl' ? 'Manga (RTL)' : 'Paged (LTR)')}`);
    }
  },

  setImageQuality(q) {
    localStorage.setItem('mf_reader_quality', q);
    if (window.Haptics) window.Haptics.light();
    if (window.App?.showToast) {
      window.App.showToast(`Image quality set to ${q === 'high' ? 'High Definition' : 'Data Saver'}`);
    }
  },

  clearCache() {
    try {
      const keysToKeep = ['mf_history', 'mf_bookmarks', 'mf_server_url', 'mf_theme', 'mf_auto_check_updates'];
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (!keysToKeep.includes(k) && !k.startsWith('mf_history') && !k.startsWith('mf_bookmark')) {
          localStorage.removeItem(k);
        }
      }
      if (window.Haptics) window.Haptics.success();
      if (window.App?.showToast) {
        window.App.showToast('🧹 Cache cleared successfully');
      }
    } catch (e) {
      console.error('Clear cache failed:', e);
    }
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
};

window.AppSettingsView = AppSettingsView;
