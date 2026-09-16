// ==========================================================================
// MangaFlow App — Offline Chapter Downloader Engine (IndexedDB)
// ==========================================================================

const Downloader = {
  DB_NAME: 'MangaFlowDB',
  DB_VERSION: 1,
  STORE_NAME: 'downloaded_chapters',
  db: null,
  downloadedSet: new Set(),
  activeDownloads: new Map(), // chapterSlug -> { cancel: fn, progress: 0 }

  async init() {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'chapterSlug' });
          store.createIndex('mangaSlug', 'mangaSlug', { unique: false });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        await this.refreshCache();
        resolve();
      };

      request.onerror = (err) => {
        console.warn('IndexedDB failed to open, offline storage unavailable:', err);
        resolve();
      };
    });
  },

  async refreshCache() {
    if (!this.db) return;
    try {
      const all = await this.getAllDownloads();
      this.downloadedSet.clear();
      all.forEach(item => this.downloadedSet.add(item.chapterSlug));
    } catch (e) {
      console.warn('Failed to refresh download cache:', e);
    }
  },

  isDownloaded(chapterSlug) {
    return this.downloadedSet.has(chapterSlug);
  },

  isDownloading(chapterSlug) {
    return this.activeDownloads.has(chapterSlug);
  },

  async getChapter(chapterSlug) {
    if (!this.db) return null;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.get(chapterSlug);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },

  async getAllDownloads() {
    if (!this.db) return [];
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => (b.downloadedAt || 0) - (a.downloadedAt || 0));
          resolve(list);
        };
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  },

  async downloadChapter(manga, chapter, onProgress, onComplete, onError) {
    const slug = chapter.slug;
    if (this.isDownloaded(slug)) {
      if (onComplete) onComplete();
      return;
    }
    if (this.isDownloading(slug)) return;

    let isCancelled = false;
    this.activeDownloads.set(slug, {
      cancel: () => { isCancelled = true; },
      progress: 0
    });

    try {
      if (window.Haptics) window.Haptics.light();
      if (window.App?.showToast) window.App.showToast(`Starting download: ${chapter.name || 'Chapter'}`);

      // 1. Fetch chapter page data
      const data = await API.getChapter(manga.slug, chapter.slug);
      const rawImages = (data.chapter?.images || []).map(img => 
        API.resolveUrl(typeof img === 'string' ? img : img.url)
      );

      if (!rawImages.length) {
        throw new Error('No images found in chapter');
      }

      const downloadedImages = [];
      let totalBytes = 0;

      // 2. Sequentially fetch images & convert to Base64
      for (let i = 0; i < rawImages.length; i++) {
        if (isCancelled) {
          this.activeDownloads.delete(slug);
          if (onError) onError(new Error('Download cancelled'));
          return;
        }

        const imgUrl = rawImages[i];
        const base64Data = await this._fetchImageAsDataUrl(imgUrl);
        downloadedImages.push(base64Data);
        totalBytes += base64Data.length;

        const current = i + 1;
        const total = rawImages.length;
        const percent = Math.round((current / total) * 100);

        if (onProgress) {
          onProgress({ current, total, percent });
        }
      }

      // 3. Save to IndexedDB
      const record = {
        chapterSlug: slug,
        chapterName: chapter.name || 'Chapter',
        mangaSlug: manga.slug,
        mangaName: manga.name || manga.slug,
        cover: manga.cover || '',
        downloadedAt: Date.now(),
        images: downloadedImages,
        pageCount: downloadedImages.length,
        sizeBytes: totalBytes
      };

      await this._saveRecord(record);
      this.downloadedSet.add(slug);
      this.activeDownloads.delete(slug);

      if (window.Haptics) window.Haptics.success();
      if (window.App?.showToast) {
        window.App.showToast(`✓ Downloaded ${chapter.name || 'Chapter'} (${record.pageCount} pages)`);
      }

      window.dispatchEvent(new CustomEvent('chapter-download-complete', { detail: { chapterSlug: slug } }));
      if (onComplete) onComplete(record);

    } catch (err) {
      this.activeDownloads.delete(slug);
      console.error('Download error:', err);
      if (window.Haptics) window.Haptics.heavy();
      if (window.App?.showToast) window.App.showToast(`❌ Download failed: ${err.message}`);
      if (onError) onError(err);
    }
  },

  async deleteChapter(chapterSlug) {
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        store.delete(chapterSlug);
        tx.oncomplete = () => {
          this.downloadedSet.delete(chapterSlug);
          if (window.Haptics) window.Haptics.medium();
          if (window.App?.showToast) window.App.showToast('Chapter deleted from downloads');
          window.dispatchEvent(new CustomEvent('chapter-deleted', { detail: { chapterSlug } }));
          resolve(true);
        };
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  },

  _saveRecord(record) {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  },

  async _fetchImageAsDataUrl(url) {
    let targetUrl = url;
    if (typeof targetUrl === 'string' && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
      if (!targetUrl.includes('/api/proxy/image')) {
        const base = window.API ? window.API.getBaseUrl() : '';
        targetUrl = `${base}/api/proxy/image?url=${encodeURIComponent(targetUrl)}`;
      }
    }
    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
};

Downloader.init();
window.Downloader = Downloader;
