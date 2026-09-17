// ==========================================================================
// MangaFlow App — In-App Update Engine
// ==========================================================================

const AppUpdater = {
  CURRENT_VERSION: '1.1.0',
  CURRENT_VERSION_CODE: 2,
  latestVersionData: null,
  isChecking: false,

  init() {
    // Check for updates on fresh app launch
    const autoCheck = localStorage.getItem('mf_auto_check_updates') !== 'false';
    if (autoCheck) {
      setTimeout(() => {
        this.checkForUpdates({ silent: true });
      }, 1500);
    }

    // Also check for updates when user returns to the app from background
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const lastCheck = parseInt(sessionStorage.getItem('mf_last_check_ts') || '0', 10);
        if (Date.now() - lastCheck > 10 * 60 * 1000) { // 10-minute cooldown
          sessionStorage.setItem('mf_last_check_ts', String(Date.now()));
          this.checkForUpdates({ silent: true });
        }
      }
    });
  },

  compareSemver(v1, v2) {
    if (!v1 || !v2) return 0;
    const p1 = String(v1).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const p2 = String(v2).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  },

  async checkForUpdates(opts = {}) {
    const silent = !!opts.silent;
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const baseUrl = API.getBaseUrl();
      // Zero-downtime multi-source update endpoints:
      // 1. GitHub Raw CDN: Instant global edge CDN, zero sleep delay, immediately reflects git pushes
      // 2. Server API: Active backend (/api/app/version)
      const endpoints = [
        `https://raw.githubusercontent.com/NeerBhardwaj1/mangaflow/main/version.json?t=${Date.now()}`,
        `${baseUrl}/api/app/version?t=${Date.now()}`
      ];

      let data = null;
      let lastErr = null;

      for (const endpoint of endpoints) {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 4000);
          const res = await fetch(endpoint, { signal: ctrl.signal });
          clearTimeout(tid);

          if (res.ok) {
            const parsed = await res.json();
            if (parsed && (parsed.versionCode || parsed.version)) {
              data = parsed;
              break;
            }
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!data) {
        throw new Error(lastErr ? lastErr.message : 'Could not fetch update metadata');
      }

      this.latestVersionData = data;
      sessionStorage.setItem('mf_last_check_ts', String(Date.now()));

      const remoteCode = parseInt(data.versionCode, 10) || 0;
      const remoteSemver = data.version || '1.0.0';

      const isNewer = (remoteCode > this.CURRENT_VERSION_CODE) || 
                      (this.compareSemver(remoteSemver, this.CURRENT_VERSION) > 0);

      // Update badge on header settings icon
      this.updateSettingsBadge(isNewer);

      if (isNewer) {
        if (silent) {
          // Fresh launch auto-popup: only show if not dismissed in this session
          const dismissedKey = `mf_dismissed_update_${remoteCode}_${remoteSemver}`;
          const isDismissed = sessionStorage.getItem(dismissedKey);
          if (!isDismissed || data.mandatory) {
            this.showUpdateModal(data);
          }
        } else {
          // User clicked manual "Check for Updates" in Settings
          this.showUpdateModal(data);
        }
        return { updateAvailable: true, data };
      } else {
        if (!silent && window.App?.showToast) {
          window.App.showToast(`✓ You're already on the latest version (v${this.CURRENT_VERSION})`);
        }
        return { updateAvailable: false, data };
      }
    } catch (err) {
      console.warn('[Updater] Check failed:', err.message);
      if (!silent && window.App?.showToast) {
        window.App.showToast(`⚠️ Could not check for updates: ${err.message}`);
      }
      return { updateAvailable: false, error: err.message };
    } finally {
      this.isChecking = false;
    }
  },

  updateSettingsBadge(show) {
    const badge = document.getElementById('settings-update-badge');
    if (badge) {
      badge.style.display = show ? 'block' : 'none';
    }
  },

  showUpdateModal(data) {
    let modal = document.getElementById('app-update-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'app-update-modal';
      modal.className = 'app-modal-backdrop';
      document.body.appendChild(modal);
    }

    const changelogItems = Array.isArray(data.changelog) ? data.changelog : [
      'Performance enhancements and bug fixes'
    ];

    modal.innerHTML = `
      <div class="app-modal-sheet app-update-sheet">
        <div class="modal-drag-pill"></div>

        <div class="update-sheet-header">
          <div class="update-icon-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
            </svg>
          </div>
          <div class="update-sheet-titles">
            <h3 class="update-sheet-title">Update Available!</h3>
            <p class="update-sheet-subtitle">${data.title || 'A new version of MangaFlow is ready.'}</p>
          </div>
          ${!data.mandatory ? `
            <button class="modal-close-btn" id="btn-update-close" aria-label="Close">✕</button>
          ` : ''}
        </div>

        <div class="update-version-row">
          <div class="update-version-chip current">
            <span class="chip-label">Current</span>
            <span class="chip-val">v${this.CURRENT_VERSION}</span>
          </div>
          <div class="update-version-arrow">➔</div>
          <div class="update-version-chip new">
            <span class="chip-label">Latest</span>
            <span class="chip-val">v${data.version || '1.1.0'}</span>
          </div>
          ${data.fileSize ? `
            <div class="update-size-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>${data.fileSize}</span>
            </div>
          ` : ''}
        </div>

        <div class="update-changelog-section" id="update-changelog-box">
          <div class="update-changelog-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            What's New in this Version:
          </div>
          <div class="update-changelog-list">
            ${changelogItems.map(item => `
              <div class="update-changelog-item">
                <span class="update-bullet">✦</span>
                <span class="update-text">${this.escape(item)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Live Download & Install Progress Card -->
        <div id="update-download-progress-box" class="update-progress-container" style="display:none;">
          <div class="update-progress-header">
            <span id="update-progress-title">Downloading Update...</span>
            <span id="update-progress-pct">0%</span>
          </div>
          <div class="update-progress-bar-bg">
            <div id="update-progress-fill" class="update-progress-bar-fill"></div>
          </div>
          <div class="update-progress-footer">
            <span id="update-progress-sub">Starting download...</span>
            <span id="update-progress-mb">0.0 / ${data.fileSize || '7.5 MB'}</span>
          </div>
        </div>

        <div id="update-error-msg" class="update-error-banner" style="display:none;"></div>

        <div class="update-sheet-actions" id="update-sheet-actions">
          <button class="btn-update-download" id="btn-update-action-main">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Update Now</span>
          </button>
          ${!data.mandatory ? `
            <button class="btn-update-later" id="btn-update-cancel">
              Cancel
            </button>
          ` : ''}
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('active'));

    // Event listeners
    const mainBtn = modal.querySelector('#btn-update-action-main');
    const cancelBtn = modal.querySelector('#btn-update-cancel');
    const closeBtn = modal.querySelector('#btn-update-close');

    if (mainBtn) {
      mainBtn.onclick = () => {
        const downloadPath = data.downloadUrl || '/api/app/download-latest';
        this.downloadAndInstall(downloadPath, data);
      };
    }

    const dismissModal = () => {
      modal.classList.remove('active');
      setTimeout(() => { modal.style.display = 'none'; }, 280);
      const remoteCode = parseInt(data.versionCode, 10) || 0;
      sessionStorage.setItem(`mf_dismissed_update_${remoteCode}_${data.version}`, 'true');
      if (window.Haptics) window.Haptics.light();
    };

    if (cancelBtn) cancelBtn.onclick = dismissModal;
    if (closeBtn) closeBtn.onclick = dismissModal;

    modal.onclick = (e) => {
      if (e.target === modal && !data.mandatory) {
        dismissModal();
      }
    };

    if (window.Haptics) window.Haptics.notification();
  },

  downloadAndInstall(url, data = {}) {
    const resolvedUrl = API.resolveUrl(url);
    const progressBox = document.getElementById('update-download-progress-box');
    const actionsBox = document.getElementById('update-sheet-actions');
    const fillEl = document.getElementById('update-progress-fill');
    const pctEl = document.getElementById('update-progress-pct');
    const subEl = document.getElementById('update-progress-sub');
    const mbEl = document.getElementById('update-progress-mb');
    const titleEl = document.getElementById('update-progress-title');
    const errorEl = document.getElementById('update-error-msg');

    if (errorEl) errorEl.style.display = 'none';
    if (progressBox) progressBox.style.display = 'flex';

    if (actionsBox) {
      actionsBox.innerHTML = `
        <button class="btn-update-later" id="btn-update-hide" style="margin-top:0;">
          Close Dialog
        </button>
      `;
      const hideBtn = actionsBox.querySelector('#btn-update-hide');
      if (hideBtn) hideBtn.onclick = () => {
        const modal = document.getElementById('app-update-modal');
        if (modal) {
          modal.classList.remove('active');
          setTimeout(() => { modal.style.display = 'none'; }, 280);
        }
      };
    }

    if (window.Haptics) window.Haptics.success();

    // Check if Native Android Download & Install Interface is available
    if (window.AndroidNative && typeof window.AndroidNative.downloadAndInstallApk === 'function') {
      subEl.textContent = 'Downloading MangaFlow update...';

      const handleProgress = (e) => {
        const { progress, downloaded, total } = e.detail || {};
        if (typeof progress === 'number' && progress >= 0) {
          fillEl.style.width = `${progress}%`;
          pctEl.textContent = `${progress}%`;
        }
        if (downloaded && total) {
          const dlMB = (downloaded / (1024 * 1024)).toFixed(1);
          const totMB = (total / (1024 * 1024)).toFixed(1);
          mbEl.textContent = `${dlMB} / ${totMB} MB`;
        }
        if (progress >= 100) {
          fillEl.classList.add('complete');
          titleEl.textContent = '🎉 Download Complete!';
          subEl.textContent = 'Opening installer... Click "Update" on the system dialog.';
          pctEl.textContent = '100%';
        }
      };

      const handleError = (e) => {
        const err = e.detail?.error || 'Download failed';
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.innerHTML = `⚠️ Error: ${this.escape(err)}. <a href="${resolvedUrl}" target="_blank" style="color:#60a5fa;text-decoration:underline;">Click to download via browser</a>`;
        }
        subEl.textContent = 'Download stopped.';
      };

      window.removeEventListener('mf-update-progress', this._lastProgressHandler);
      window.removeEventListener('mf-update-error', this._lastErrorHandler);
      this._lastProgressHandler = handleProgress;
      this._lastErrorHandler = handleError;
      window.addEventListener('mf-update-progress', handleProgress);
      window.addEventListener('mf-update-error', handleError);

      // Invoke Android Java native method to download and launch package installer
      window.AndroidNative.downloadAndInstallApk(resolvedUrl);
    } else {
      // Browser fallback (Web version)
      subEl.textContent = 'Downloading APK file...';
      try {
        const a = document.createElement('a');
        a.href = resolvedUrl;
        a.download = `MangaFlow-v${data.version || 'latest'}.apk`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        window.location.href = resolvedUrl;
      }

      setTimeout(() => {
        fillEl.style.width = '100%';
        fillEl.classList.add('complete');
        pctEl.textContent = '100%';
        titleEl.textContent = 'Download Started';
        subEl.textContent = 'Check your downloads folder to install MangaFlow.';
      }, 1200);
    }
  },

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
};

window.AppUpdater = AppUpdater;
