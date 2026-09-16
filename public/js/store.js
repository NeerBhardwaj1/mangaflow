// ==========================================================================
// MangaFlow Local Store & State Persistence
// ==========================================================================

const Store = {
  KEYS: {
    BOOKMARKS: 'mangaflow_bookmarks',
    HISTORY: 'mangaflow_history',
    SETTINGS: 'mangaflow_reader_settings',
  },

  // 1. Bookmarks
  getBookmarks() {
    try {
      const val = localStorage.getItem(this.KEYS.BOOKMARKS);
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  },

  isBookmarked(slug) {
    const list = this.getBookmarks();
    return list.some((item) => item.slug === slug);
  },

  toggleBookmark(manga) {
    if (!manga || !manga.slug) return false;
    let list = this.getBookmarks();
    const idx = list.findIndex((item) => item.slug === manga.slug);

    let added = false;
    if (idx !== -1) {
      list.splice(idx, 1);
      added = false;
    } else {
      list.unshift({
        id: manga.id,
        slug: manga.slug,
        name: manga.name,
        cover: manga.cover,
        status: manga.status,
        rating: manga.rating,
        addedAt: Date.now(),
      });
      added = true;
    }

    try {
      localStorage.setItem(this.KEYS.BOOKMARKS, JSON.stringify(list));
    } catch (e) {}

    this.updateBadge();
    return added;
  },

  removeBookmark(slug) {
    let list = this.getBookmarks();
    list = list.filter((item) => item.slug !== slug);
    try {
      localStorage.setItem(this.KEYS.BOOKMARKS, JSON.stringify(list));
    } catch (e) {}
    this.updateBadge();
  },

  // 2. Reading History
  getHistory() {
    try {
      const val = localStorage.getItem(this.KEYS.HISTORY);
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  },

  getMangaHistory(mangaSlug) {
    const list = this.getHistory();
    return list.find((item) => item.mangaSlug === mangaSlug) || null;
  },

  saveHistory({ manga, chapter, page = 1 }) {
    if (!manga || !chapter) return;
    let list = this.getHistory();
    list = list.filter((item) => item.mangaSlug !== manga.slug);

    list.unshift({
      mangaSlug: manga.slug,
      mangaName: manga.name,
      cover: manga.cover,
      chapterSlug: chapter.slug,
      chapterName: chapter.name,
      chapterNumber: chapter.number,
      page: page,
      timestamp: Date.now(),
    });

    // Keep last 50 read manga
    if (list.length > 50) list = list.slice(0, 50);

    try {
      localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(list));
    } catch (e) {}
  },

  clearHistory() {
    try {
      localStorage.removeItem(this.KEYS.HISTORY);
    } catch (e) {}
  },

  // 3. Reader Preferences
  getReaderSettings() {
    try {
      const val = localStorage.getItem(this.KEYS.SETTINGS);
      return val ? JSON.parse(val) : { mode: 'webtoon', width: 'md' };
    } catch (e) {
      return { mode: 'webtoon', width: 'md' };
    }
  },

  saveReaderSettings(settings) {
    try {
      const current = this.getReaderSettings();
      const merged = { ...current, ...settings };
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(merged));
      return merged;
    } catch (e) {
      return settings;
    }
  },

  // Updates badge on header if library has items
  updateBadge() {
    const badge = document.getElementById('library-badge');
    if (!badge) return;
    const bookmarks = this.getBookmarks();
    if (bookmarks.length > 0) {
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  },
};

window.Store = Store;
