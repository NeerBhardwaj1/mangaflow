// ==========================================================================
// MangaFlow API Client Service
// ==========================================================================

const API = {
  baseUrl: '/api',

  async request(endpoint, params = {}) {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const url = `${this.baseUrl}${endpoint}${queryString}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${endpoint}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  // 1. Home Feed
  async getHome() {
    const res = await this.request('/home');
    return res.data;
  },

  // 2. Search & Filter
  async search(params = {}) {
    const res = await this.request('/search', params);
    return res.data;
  },

  // 3. Genres Catalogue
  async getGenres() {
    const res = await this.request('/genres');
    return res.data;
  },

  // 4. Rankings
  async getRanking(params = {}) {
    const res = await this.request('/ranking', params);
    return res.data;
  },

  // 5. Latest Updates
  async getLatest(params = {}) {
    const res = await this.request('/latest', params);
    return res.data;
  },

  // 6. Manga Details
  async getManga(slug) {
    const res = await this.request(`/manga/${encodeURIComponent(slug)}`);
    return res.data;
  },

  // 7. Chapter Reader Data
  async getChapter(mangaSlug, chapterSlug) {
    const res = await this.request(
      `/chapter/${encodeURIComponent(mangaSlug)}/${encodeURIComponent(chapterSlug)}`
    );
    return res.data;
  },
};

window.API = API;
