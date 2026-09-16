// ==========================================================================
// MangaFlow App — Enhanced Data Store & Library Engine
// ==========================================================================

const Store = {
  BOOKMARKS_KEY: 'mf_bookmarks',
  HISTORY_KEY: 'mf_history',
  SETTINGS_KEY: 'mf_settings',

  SHELVES: [
    { id: 'all', name: 'All Saved', icon: '📚' },
    { id: 'reading', name: 'Reading', icon: '📖' },
    { id: 'favorites', name: 'Favorites', icon: '⭐' },
    { id: 'plan', name: 'Plan to Read', icon: '📌' },
    { id: 'completed', name: 'Completed', icon: '✓' }
  ],

  _get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  },

  _set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  // --------------------------------------------------------------------------
  // Bookmarks & Custom Shelves
  // --------------------------------------------------------------------------
  getBookmarks() {
    return this._get(this.BOOKMARKS_KEY);
  },

  isBookmarked(slug) {
    return this.getBookmarks().some(b => b.slug === slug);
  },

  getBookmark(slug) {
    return this.getBookmarks().find(b => b.slug === slug);
  },

  toggleBookmark(manga, shelf = 'reading') {
    const list = this.getBookmarks();
    const idx = list.findIndex(b => b.slug === manga.slug);

    if (idx >= 0) {
      list.splice(idx, 1);
      this._set(this.BOOKMARKS_KEY, list);
      this.updateBadge();
      if (window.Haptics) window.Haptics.medium();
      return false;
    }

    list.unshift({
      slug: manga.slug,
      name: manga.name,
      cover: manga.cover,
      shelf: shelf,
      totalChapters: manga.chapters ? manga.chapters.length : 0,
      addedAt: Date.now()
    });

    this._set(this.BOOKMARKS_KEY, list);
    this.updateBadge();
    if (window.Haptics) window.Haptics.medium();
    return true;
  },

  setShelf(slug, shelf) {
    const list = this.getBookmarks();
    const item = list.find(b => b.slug === slug);
    if (item) {
      item.shelf = shelf;
      this._set(this.BOOKMARKS_KEY, list);
      if (window.Haptics) window.Haptics.light();
      return true;
    }
    return false;
  },

  // --------------------------------------------------------------------------
  // Unread Chapters Tracking
  // --------------------------------------------------------------------------
  updateMangaChapterCount(slug, totalCount) {
    const list = this.getBookmarks();
    const item = list.find(b => b.slug === slug);
    if (item && totalCount > (item.totalChapters || 0)) {
      item.totalChapters = totalCount;
      this._set(this.BOOKMARKS_KEY, list);
    }
  },

  getUnreadCount(slug, currentTotal) {
    const history = this.getMangaHistory(slug);
    if (!history || !currentTotal) return 0;
    const readIndex = history.chapterIndex || 1;
    const unread = currentTotal - readIndex;
    return unread > 0 ? unread : 0;
  },

  // --------------------------------------------------------------------------
  // Reading History
  // --------------------------------------------------------------------------
  getHistory() {
    return this._get(this.HISTORY_KEY);
  },

  getMangaHistory(mangaSlug) {
    return this.getHistory().find(h => h.mangaSlug === mangaSlug);
  },

  saveHistory(entry) {
    const list = this.getHistory().filter(h => h.mangaSlug !== entry.mangaSlug);
    list.unshift({
      ...entry,
      timestamp: Date.now()
    });
    if (list.length > 100) list.length = 100;
    this._set(this.HISTORY_KEY, list);
  },

  clearHistory() {
    this._set(this.HISTORY_KEY, []);
    if (window.Haptics) window.Haptics.heavy();
  },

  // --------------------------------------------------------------------------
  // Backup & Restore
  // --------------------------------------------------------------------------
  exportBackup() {
    const backupData = {
      version: 1,
      appName: 'MangaFlow',
      exportedAt: new Date().toISOString(),
      theme: localStorage.getItem('mf_theme') || 'cyberpunk',
      bookmarks: this.getBookmarks(),
      history: this.getHistory()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `mangaflow_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.Haptics) window.Haptics.success();
    if (window.App?.showToast) window.App.showToast('✓ Backup exported successfully');
  },

  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || (!data.bookmarks && !data.history)) {
        throw new Error('Invalid backup file format');
      }

      if (Array.isArray(data.bookmarks)) {
        this._set(this.BOOKMARKS_KEY, data.bookmarks);
      }
      if (Array.isArray(data.history)) {
        this._set(this.HISTORY_KEY, data.history);
      }
      if (data.theme && window.ThemeManager) {
        window.ThemeManager.setTheme(data.theme, false);
      }

      this.updateBadge();
      if (window.Haptics) window.Haptics.success();
      if (window.App?.showToast) window.App.showToast(`✓ Restored ${data.bookmarks?.length || 0} bookmarks`);
      return true;
    } catch (err) {
      if (window.Haptics) window.Haptics.heavy();
      if (window.App?.showToast) window.App.showToast(`❌ Restore failed: ${err.message}`);
      return false;
    }
  },

  updateBadge() {
    const dot = document.getElementById('lib-dot');
    if (dot) dot.style.display = this.getBookmarks().length > 0 ? 'block' : 'none';
  }
};

window.Store = Store;
