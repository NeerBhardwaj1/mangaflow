// ==========================================================================
// MangaFlow App — API Client
// ==========================================================================

const API = {
  DEFAULT_LAN_HOST: 'https://mangaflow-wi3s.onrender.com',
  LOCAL_DEV_HOST: 'http://localhost:3000',
  _resolvedBaseUrl: null,

  async detectFastestServer() {
    const saved = localStorage.getItem('mf_server_url');
    if (saved) {
      const clean = saved.replace(/\/+$/, '');
      // If user had saved localhost, test if it's currently reachable
      if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 800);
          const res = await fetch(`${clean}/api/health`, { signal: ctrl.signal });
          clearTimeout(tid);
          if (res.ok) {
            this._resolvedBaseUrl = clean;
            return clean;
          }
        } catch (e) {
          console.warn('[API] Localhost unreachable, falling back to cloud host');
        }
      } else {
        this._resolvedBaseUrl = clean;
        return this._resolvedBaseUrl;
      }
    }

    // Auto-detect USB debugging or local dev reverse tunnel on port 3000
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 800);
      const res = await fetch(`${this.LOCAL_DEV_HOST}/api/health`, { signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) {
        this._resolvedBaseUrl = this.LOCAL_DEV_HOST;
        console.log('[API] Auto-detected local USB dev server on port 3000');
        return this.LOCAL_DEV_HOST;
      }
    } catch (e) {}

    this._resolvedBaseUrl = this.DEFAULT_LAN_HOST;
    return this._resolvedBaseUrl;
  },

  getBaseUrl() {
    const saved = localStorage.getItem('mf_server_url');
    if (saved) return saved.replace(/\/+$/, '');

    if (this._resolvedBaseUrl) return this._resolvedBaseUrl;

    // Check if running inside Capacitor Android native environment
    const isCapacitor = window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();
    const isAndroidProtocol = location.protocol === 'capacitor:' || location.protocol === 'file:';
    const isBareLocalhost = location.hostname === 'localhost' && !location.port;

    if (isCapacitor || isAndroidProtocol || isBareLocalhost) {
      return this.DEFAULT_LAN_HOST;
    }

    // In standard browser testing on PC, relative path points to current host
    return '';
  },

  setBaseUrl(url) {
    const cleanUrl = (url || '').trim().replace(/\/+$/, '');
    if (cleanUrl) {
      localStorage.setItem('mf_server_url', cleanUrl);
    } else {
      localStorage.removeItem('mf_server_url');
    }
  },

  resolveUrl(url) {
    if (!url) return '';
    if (typeof url !== 'string') return url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const base = this.getBaseUrl();
    if (!base) return url;
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  },

  _deepResolveImages(data, base) {
    if (!data || !base) return data;

    if (typeof data === 'string') {
      if (data.startsWith('/api/proxy/image') || (data.startsWith('/') && !data.startsWith('//') && !data.startsWith('/app/'))) {
        return `${base}${data}`;
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this._deepResolveImages(item, base));
    }

    if (typeof data === 'object') {
      const out = {};
      for (const k of Object.keys(data)) {
        out[k] = this._deepResolveImages(data[k], base);
      }
      return out;
    }

    return data;
  },

  async pingServer(targetUrl) {
    const base = (targetUrl !== undefined ? targetUrl : this.getBaseUrl()).replace(/\/+$/, '');
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${base}/api/home`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      if (res.ok) {
        return { ok: true, latency };
      }
      return { ok: false, error: `HTTP ${res.status}` };
    } catch (err) {
      return { ok: false, error: err.name === 'AbortError' ? 'Timeout (4s)' : 'Unreachable' };
    }
  },

  async _fetch(path) {
    if (this._resolvedBaseUrl === null && !localStorage.getItem('mf_server_url')) {
      await this.detectFastestServer();
    }
    const base = this.getBaseUrl();
    const fullUrl = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    try {
      const res = await fetch(fullUrl);
      if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
      const json = await res.json();
      const rawData = json.data !== undefined ? json.data : json;
      return this._deepResolveImages(rawData, base);
    } catch (err) {
      if (base !== this.DEFAULT_LAN_HOST) {
        console.warn(`[API] Host ${base} failed, falling back to ${this.DEFAULT_LAN_HOST}`);
        this._resolvedBaseUrl = this.DEFAULT_LAN_HOST;
        const fallbackUrl = `${this.DEFAULT_LAN_HOST}${path.startsWith('/') ? '' : '/'}${path}`;
        const res2 = await fetch(fallbackUrl);
        if (!res2.ok) throw new Error(`API ${res2.status} on fallback ${path}`);
        const json2 = await res2.json();
        const rawData2 = json2.data !== undefined ? json2.data : json2;
        return this._deepResolveImages(rawData2, this.DEFAULT_LAN_HOST);
      }
      throw err;
    }
  },

  async getHome() {
    return this._fetch('/api/home');
  },

  async getLatest(arg = 1) {
    const page = typeof arg === 'object' ? (arg.page || 1) : arg;
    return this._fetch(`/api/latest?page=${page}`);
  },

  async search(arg1 = {}, arg2 = 1) {
    let params = {};
    if (typeof arg1 === 'string') {
      params = { q: arg1, page: arg2 };
    } else {
      params = arg1 || {};
    }
    const q = new URLSearchParams(params).toString();
    return this._fetch(`/api/search?${q}`);
  },

  async getManga(slug) {
    return this._fetch(`/api/manga/${encodeURIComponent(slug)}`);
  },

  async getChapter(mangaSlug, chapterSlug) {
    return this._fetch(`/api/chapter/${encodeURIComponent(mangaSlug)}/${encodeURIComponent(chapterSlug)}`);
  },

  async getGenres() {
    return this._fetch('/api/genres');
  },

  async getRanking(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this._fetch(`/api/ranking?${q}`);
  },
};

window.API = API;
