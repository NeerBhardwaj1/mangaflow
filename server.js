const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const MangaDex = require('./providers/mangadex');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/app', express.static(path.join(__dirname, 'App')));
app.get('/MangaFlow.apk', (req, res) => {
  res.download(path.join(__dirname, 'MangaFlow.apk'), 'MangaFlow.apk');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', branding: 'MangaFlow', time: Date.now() });
});

// Dynamic Build ID Resolver
let cachedBuildId = '_HrvUeHQGJzVTKw7e8Ag3';
let lastBuildIdFetch = 0;

async function getBuildId(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedBuildId && now - lastBuildIdFetch < 3600000) {
    return cachedBuildId;
  }

  try {
    const html = await fetchRawText('https://comizy.io/home');
    const idx = html.indexOf('id="__NEXT_DATA__"');
    if (idx !== -1) {
      const start = html.indexOf('>', idx) + 1;
      const end = html.indexOf('</script>', start);
      const data = JSON.parse(html.slice(start, end));
      if (data.buildId) {
        cachedBuildId = data.buildId;
        lastBuildIdFetch = now;
        console.log('[BuildID] Discovered active buildId:', cachedBuildId);
        return cachedBuildId;
      }
    }
  } catch (err) {
    console.error('[BuildID] Failed to refresh build ID:', err.message);
  }
  return cachedBuildId;
}

function fetchRawText(targetUrl) {
  return new Promise((resolve, reject) => {
    https.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    ).on('error', reject);
  });
}

async function fetchNextData(routePath, queryParams = {}) {
  let buildId = await getBuildId();
  let queryStr = new URLSearchParams(queryParams).toString();
  let fullUrl = `https://comizy.io/_next/data/${buildId}/${routePath}.json${queryStr ? '?' + queryStr : ''}`;

  let res = await executeRequest(fullUrl);
  if (res.status === 404) {
    // Attempt re-discovering buildId once
    console.log('[API] 404 encountered, attempting build ID refresh...');
    buildId = await getBuildId(true);
    fullUrl = `https://comizy.io/_next/data/${buildId}/${routePath}.json${queryStr ? '?' + queryStr : ''}`;
    res = await executeRequest(fullUrl);
  }

  if (res.status !== 200) {
    throw new Error(`Upstream request failed with status ${res.status}`);
  }

  const json = JSON.parse(res.body);
  return json.pageProps || {};
}

function executeRequest(targetUrl) {
  return new Promise((resolve, reject) => {
    https.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://comizy.io/',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    ).on('error', reject);
  });
}

function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  const lines = text.split('\n');
  const cleanedLines = [];
  let inLinksBlock = false;

  for (let line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    // Check if this line starts a "Links" or "Official Links" section
    if (lower.match(/^(?:[-*]\s*)?(?:\*{1,2}|_{1,2})?(?:links|official\s+links|external\s+links)(?:\*{1,2}|_{1,2})?:?/i)) {
      inLinksBlock = true;
      continue;
    }

    if (inLinksBlock) {
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.includes('http') || trimmed.includes('[') || !trimmed) {
        continue;
      } else {
        inLinksBlock = false;
      }
    }

    // Skip promotional / credit / source lines
    if (lower.match(/^(?:[-*]\s*)?(?:\*{1,2}|_{1,2})?(?:source|original\s+(?:webtoon|work|manga|comic|novel)|official\s+(?:english|raw|translation|release)|from\s+(?:viz|yen\s+press|seven\s+seas|kodansha|webtoon|tapas|lezhin|tappytoon|kuaikan|bilibili|mangaplus)|support\s+(?:the\s+author|us|creator)|join\s+(?:our\s+)?discord|scanlated\s+by|translated\s+by|read\s+(?:first|more|free)\s+at|uploaded\s+on|visit\s+our\s+(?:website|site))(?:\*{1,2}|_{1,2})?:?/i)) {
      continue;
    }

    if (lower.includes('discord.gg') || lower.includes('patreon.com') || lower.includes('ko-fi.com') || lower.includes('t.me/') || lower.includes('paypal.me')) {
      continue;
    }

    // Strip markdown links like [Title](http...) -> Title
    let cleanedLine = line.replace(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/gi, '$1');
    // Strip raw URLs
    cleanedLine = cleanedLine.replace(/https?:\/\/\S+/gi, '');
    // Strip external site names
    cleanedLine = cleanedLine.replace(/\b(?:mangadex|comizy(?:\.io)?|lezhin|bomtoon|kakaopage|piccoma|tapas|tappytoon|bilibili|kuaikan)\b/gi, '');

    // Skip line if no alphanumeric content left
    if (!/[a-zA-Z0-9]/.test(cleanedLine)) continue;

    cleanedLines.push(cleanedLine.trim());
  }

  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function cleanChapterName(name, num) {
  if (!name && !num) return 'Chapter 1';
  let str = String(name || '').trim();

  // If empty or purely a number like "1" or "12.5"
  if (!str || /^\d+(?:\.\d+)?$/.test(str)) {
    return `Chapter ${str || num || '1'}`;
  }

  // Remove all bracket-enclosed groups (scanlator names, quality tags, etc.)
  str = str.replace(/\[[^\]]*\]/gi, '');
  // Remove domain names or URLs in parentheses
  str = str.replace(/\([^)]*(?:\.com|\.net|\.org|\.io|\.gg|\.me|http|\/\/)[^)]*\)/gi, '');
  // Remove promo suffixes
  str = str.replace(/\s*[-–—]\s*(?:read\s+at|visit|free\s+on|scan|upload|credit|translated\s+by).*/gi, '');
  // Remove stray URLs
  str = str.replace(/https?:\/\/\S+/gi, '');
  // Remove scanlator / group credit mentions
  str = str.replace(/\s*(?:by|from|via|translated by|scanlated by|scan by)\s+[\w\s]+$/gi, '');

  // Fix "Chapter : Title" -> "Chapter: Title"
  str = str.replace(/^chapter\s*:\s*/i, 'Chapter: ');
  // If it's "Chapter side-story-1" -> "Side Story 1"
  str = str.replace(/^chapter\s+side[-_\s]*story[-_\s]*(\d+)/i, 'Side Story $1');
  // If it's "Chapter spoiler" -> "Spoiler", "Chapter notice" -> "Notice"
  str = str.replace(/^chapter\s+(spoiler|notice|announcement)/i, (m, p) => p.charAt(0).toUpperCase() + p.slice(1));
  // Fix spacing around colons: "Chapter 1 : Romance Dawn" -> "Chapter 1: Romance Dawn"
  str = str.replace(/\s+:\s*/g, ': ');
  // Standardize "ch. 1" / "ch 1" -> "Chapter 1"
  str = str.replace(/^ch\.?\s*(\d+(?:\.\d+)?)/i, 'Chapter $1');
  // Standardize "ep. 1" / "ep 1" -> "Episode 1"
  str = str.replace(/^ep\.?\s*(\d+(?:\.\d+)?)/i, 'Episode $1');
  // Standardize lowercase "chapter 1" -> "Chapter 1"
  if (/^chapter\s/i.test(str)) {
    str = 'Chapter' + str.slice(7);
  }
  // Collapse multiple spaces
  str = str.replace(/\s{2,}/g, ' ').trim();
  // Strip dangling punctuation at the end (- , : ;)
  str = str.replace(/[-–—:,;]+$/, '').trim();

  return str || (num ? `Chapter ${num}` : 'Chapter');
}

function extractChapterNumber(ch) {
  if (!ch) return Infinity;
  const name = String(ch.name || '');
  if (/prologue/i.test(name)) return 0;
  const nm = name.match(/(?:chapter|ch\.?|ep\.?|episode)\s*(\d+(?:\.\d+)?)/i);
  if (nm) return parseFloat(nm[1]);

  const slug = String(ch.slug || '');
  const sm = slug.match(/chapter-(\d+(?:-\d+)?)/i);
  if (sm) {
    return parseFloat(sm[1].replace('-', '.'));
  }

  if (typeof ch.number === 'number' && !isNaN(ch.number)) return ch.number;
  return Infinity;
}

function findFirstChapter(chapters, defaultFirst = null) {
  if (!chapters || chapters.length === 0) return defaultFirst;

  // 1. Prefer Chapter 0 or Prologue
  const ch0 = chapters.find(c => {
    const num = extractChapterNumber(c);
    return num === 0 || /prologue/i.test(c.name || '');
  });
  if (ch0) return ch0;

  // 2. Prefer Chapter 1
  const ch1 = chapters.find(c => {
    const num = extractChapterNumber(c);
    return num === 1;
  });
  if (ch1) return ch1;

  // 3. Otherwise find lowest non-negative number
  let lowest = null;
  let lowestNum = Infinity;
  for (const c of chapters) {
    const num = extractChapterNumber(c);
    if (num >= 0 && num < lowestNum) {
      lowestNum = num;
      lowest = c;
    }
  }

  return lowest || defaultFirst || chapters[chapters.length - 1];
}

// Data Sanitization & Image Proxying Pipeline
function sanitizeData(obj, keyName = '') {
  if (!obj) return obj;

  if (typeof obj === 'string') {
    // If it's a summary or description, clean thoroughly
    if (keyName === 'summary' || keyName === 'description' || keyName === 'synopsis') {
      return cleanText(obj);
    }

    // If it's a chapter name, clean promo brackets and junk
    if (keyName === 'name') {
      return cleanChapterName(obj);
    }

    // Rewrite image URLs to our proxy
    if (obj.startsWith('https://rx.comizy.io/') || obj.includes('.cmzcdn.org/') || obj.includes('.mbbcdn.com/') || obj.includes('mangadex.network') || obj.includes('uploads.mangadex.org')) {
      return `/api/proxy/image?url=${encodeURIComponent(obj)}`;
    }

    // Scrub mentions of any upstream or competitor sites
    return obj
      .replace(/comizy\.io/gi, 'mangaflow.app')
      .replace(/comizy/gi, 'MangaFlow')
      .replace(/COMIZY/g, 'MangaFlow')
      .replace(/mangadex/gi, 'MangaFlow')
      .replace(/https?:\/\/[a-zA-Z0-9_.\-\/]+/gi, '');
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeData(item, keyName));
  }

  if (typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      if (key === 'siteConfig') continue; // omit upstream configuration
      cleaned[key] = sanitizeData(obj[key], key);
    }
    return cleaned;
  }

  return obj;
}

// -------------------------------------------------------------
// Search Relevance Scoring
// -------------------------------------------------------------
function scoreTitleRelevance(itemName, query) {
  if (!itemName || !query) return 0;
  const name = itemName.toLowerCase().trim();
  const q = query.toLowerCase().trim();

  // Exact match
  if (name === q) return 100;

  // Name starts with the query
  if (name.startsWith(q)) return 80;

  // Query matches as a whole word within the title
  const wordBoundary = new RegExp('\\b' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
  if (wordBoundary.test(name)) return 60;

  // Name contains query as a substring
  if (name.includes(q)) return 40;

  // Partial: query words individually appear in the title
  const queryWords = q.split(/\s+/).filter(w => w.length > 1);
  if (queryWords.length > 1) {
    const matchedWords = queryWords.filter(w => name.includes(w));
    if (matchedWords.length === queryWords.length) return 35;
    if (matchedWords.length > 0) return 20;
  }

  // Normalized comparison (strip non-alphanumeric)
  const normName = name.replace(/[^a-z0-9]/g, '');
  const normQ = q.replace(/[^a-z0-9]/g, '');
  if (normName === normQ) return 90;
  if (normName.startsWith(normQ)) return 70;
  if (normName.includes(normQ)) return 30;

  return 0;
}

function sortByRelevance(items, query) {
  return items
    .map((item, originalIndex) => ({
      item,
      score: scoreTitleRelevance(item.name, query),
      originalIndex,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.originalIndex - b.originalIndex;
    })
    .map(entry => entry.item);
}

// -------------------------------------------------------------
// Health Check (for Render + keep-alive)
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// -------------------------------------------------------------
// Curated Famous & Iconic Manga (Demon Slayer, Dandadan, A Silent Voice, One Piece, etc.)
// -------------------------------------------------------------
const FAMOUS_MANGA_CURATED = [
  {
    name: 'Demon Slayer: Kimetsu no Yaiba',
    slug: 'kimetsu-no-yaiba',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fa5a9645b9b9b.webp',
    status: 'Completed',
    rating: 4.95,
    displayChapters: '243 chapters',
    displayViews: '5.8M views',
    summary: 'Tanjiro Kamado sets out on a perilous path to become a demon slayer to avenge his slaughtered family and cure his cursed sister Nezuko.',
    isHot: true,
  },
  {
    name: 'Dandadan',
    slug: 'dandadan',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F4d5d46b27986.webp',
    status: 'Ongoing',
    rating: 4.92,
    displayChapters: '281 chapters',
    displayViews: '3.4M views',
    summary: 'Momo Ayase, who believes in ghosts, and Okarun, who believes in aliens, find out both occult forces are terrifyingly real.',
    isHot: true,
  },
  {
    name: 'A Silent Voice',
    slug: 'koe-no-katachi',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fca48cd0a0a4b.webp',
    status: 'Completed',
    rating: 4.98,
    displayChapters: '64 chapters',
    displayViews: '2.9M views',
    summary: 'Shoya Ishida seeks redemption after bullying Shoko Nishimiya, a deaf girl, in elementary school, striving to make amends and understand her heart.',
    isHot: true,
  },
  {
    name: 'Tokyo Revengers',
    slug: 'tokyo-revengers',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fd1169daa65e8.webp',
    status: 'Completed',
    rating: 4.88,
    displayChapters: '317 chapters',
    displayViews: '4.2M views',
    summary: 'Takemichi Hanagaki travels back 12 years in time to his middle school days to save his ex-girlfriend Hinata Tachibana from the Tokyo Manji Gang.',
    isHot: true,
  },
  {
    name: 'One Piece',
    slug: 'one-piece',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F475200263dfc.webp',
    status: 'Ongoing',
    rating: 4.99,
    displayChapters: '1,308 chapters',
    displayViews: '12.5M views',
    summary: 'Monkey D. Luffy and the Straw Hat Pirates embark on the Grand Line to find the legendary treasure One Piece and become King of the Pirates.',
    isHot: true,
  },
  {
    name: 'Solo Leveling',
    slug: 'solo-leveling',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fc8ccb9d017d6.webp',
    status: 'Completed',
    rating: 4.97,
    displayChapters: '270 chapters',
    displayViews: '9.8M views',
    summary: 'Sung Jinwoo, known as the weakest hunter of all humanity, awakes in a hospital with a mysterious quest log that allows him to level up infinitely.',
    isHot: true,
  },
  {
    name: 'Jujutsu Kaisen',
    slug: 'jujutsu-kaisen',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fad0cc8942378.webp',
    status: 'Completed',
    rating: 4.93,
    displayChapters: '478 chapters',
    displayViews: '6.7M views',
    summary: 'Yuji Itadori swallows a cursed finger of the King of Curses Sukuna and enrolls in Tokyo Jujutsu High to fight deadly supernatural curses.',
    isHot: true,
  },
  {
    name: 'Chainsaw Man',
    slug: 'chainsaw-man',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2Fa2a5ac41ca4e.webp',
    status: 'Ongoing',
    rating: 4.91,
    displayChapters: '392 chapters',
    displayViews: '5.1M views',
    summary: 'Denji makes a contract with the Chainsaw Devil Pochita and is reborn as Chainsaw Man, joining the Public Safety Devil Hunters.',
    isHot: true,
  },
  {
    name: 'Attack on Titan',
    slug: 'attack-on-titan',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F36c156e0fafc.webp',
    status: 'Completed',
    rating: 4.96,
    displayChapters: '148 chapters',
    displayViews: '8.4M views',
    summary: 'Eren Yeager vows to eradicate every Titan after his mother is devoured, joining the Scout Regiment in humanity\'s fight for survival behind massive walls.',
    isHot: true,
  },
  {
    name: 'SPY x FAMILY',
    slug: 'spy-x-family',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F2735808fdf5a.webp',
    status: 'Ongoing',
    rating: 4.92,
    displayChapters: '278 chapters',
    displayViews: '3.9M views',
    summary: 'Master spy Twilight creates a faux family with telepathic orphan Anya and assassin Yor, unaware of each other\'s secret identities.',
    isHot: true,
  },
  {
    name: 'Berserk',
    slug: 'berserk',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F712f874bf1de.webp',
    status: 'Ongoing',
    rating: 4.99,
    displayChapters: '559 chapters',
    displayViews: '7.1M views',
    summary: 'Guts, the Black Swordsman, wields the Dragon Slayer in a dark fantasy realm to exact vengeance against Griffith and the demonic God Hand.',
    isHot: true,
  },
  {
    name: 'Bleach',
    slug: 'bleach',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F197948f2ac4d.webp',
    status: 'Completed',
    rating: 4.89,
    displayChapters: '728 chapters',
    displayViews: '6.2M views',
    summary: 'High school student Ichigo Kurosaki gains the powers of a Soul Reaper to defend humans against evil spirits and guide departed souls.',
    isHot: true,
  },
  {
    name: 'Naruto',
    slug: 'naruto',
    cover: '/api/proxy/image?url=https%3A%2F%2Frx.comizy.io%2Fcovers%2F0b72878c8bcc.webp',
    status: 'Completed',
    rating: 4.94,
    displayChapters: '748 chapters',
    displayViews: '11.0M views',
    summary: 'Naruto Uzumaki, a young ninja carrying the Nine-Tailed Fox spirit, dreams of earning the respect of his village and becoming Hokage.',
    isHot: true,
  },
];

// 1. Home Feed
app.get('/api/home', async (req, res) => {
  try {
    const data = await fetchNextData('home').catch(() => ({}));

    const rawHero = sanitizeData(data.heroItems || []);
    const rawTrending = sanitizeData(data.trendingItems || []);
    const rawPopular = sanitizeData(data.popularItems || []);

    const famousSlugs = new Set(FAMOUS_MANGA_CURATED.map(m => m.slug));
    const mergedHero = [...FAMOUS_MANGA_CURATED.slice(0, 8), ...rawHero.filter(m => !famousSlugs.has(m.slug))];
    const mergedTrending = [...FAMOUS_MANGA_CURATED, ...rawTrending.filter(m => !famousSlugs.has(m.slug))];
    const mergedPopular = [...FAMOUS_MANGA_CURATED.slice(4), ...rawPopular.filter(m => !famousSlugs.has(m.slug))];

    const response = {
      heroItems: mergedHero,
      famousItems: FAMOUS_MANGA_CURATED,
      trendingItems: mergedTrending,
      popularItems: mergedPopular,
      latest: sanitizeData(data.latest || []),
      risingItems: sanitizeData(data.risingItems || []),
      topUpdateItems: sanitizeData(data.topUpdateItems || []),
    };
    res.json({ success: true, data: response });
  } catch (err) {
    console.error('[API /home] Error:', err.message);
    res.json({
      success: true,
      data: {
        heroItems: FAMOUS_MANGA_CURATED.slice(0, 8),
        famousItems: FAMOUS_MANGA_CURATED,
        trendingItems: FAMOUS_MANGA_CURATED,
        popularItems: FAMOUS_MANGA_CURATED.slice(4),
        latest: [],
      }
    });
  }
});

// 2. Search & Filter (Multi-Source Engine: Comizy + MangaDex 85k+)
app.get('/api/search', async (req, res) => {
  try {
    const { q, genres, type, status, sort, page, source = 'all' } = req.query;
    const queryParams = {};
    if (q) queryParams.q = q;
    if (genres) queryParams.genres = genres;
    if (type) queryParams.type = type;
    if (status) queryParams.status = status;
    if (sort) queryParams.sort = sort;
    if (page) queryParams.page = page;

    let primaryItems = [];
    let mangadexItems = [];
    let totalPrimary = 0;

    // Fetch primary source unless user filtered to mangadex only
    if (source === 'all' || source === 'webtoons') {
      try {
        const data = await fetchNextData('search', queryParams);
        primaryItems = sanitizeData(data.ssrItems || []);
        totalPrimary = data.ssrPagination?.total || primaryItems.length;
      } catch (err) {
        console.error('[API /search] Primary provider error:', err.message);
      }
    }

    // Fetch MangaDex unless user filtered to webtoons only
    if (source === 'all' || source === 'mangadex' || source === 'manga' || source === 'archive') {
      try {
        const mdRes = await MangaDex.search(q, {
          page: parseInt(page, 10) || 1,
          limit: 24,
          sort,
        });
        mangadexItems = mdRes.items || [];
      } catch (err) {
        console.error('[API /search] MangaDex provider error:', err.message);
      }
    }

    // Deduplication: Only add MangaDex titles that are NOT present in Primary
    const primaryTitleSet = new Set(
      primaryItems.map((item) => (item.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''))
    );

    const filteredMangaDex = mangadexItems.filter((md) => {
      const norm = (md.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return !primaryTitleSet.has(norm);
    });

    let combinedItems = [];
    if (source === 'mangadex' || source === 'manga' || source === 'archive') {
      combinedItems = mangadexItems;
    } else if (source === 'webtoons') {
      combinedItems = primaryItems;
    } else {
      // Merge: Primary items first, then unique new titles from MangaDex
      combinedItems = [...primaryItems, ...filteredMangaDex];
    }

    // Sort by relevance when a search query is present
    if (q && q.trim()) {
      combinedItems = sortByRelevance(combinedItems, q.trim());
    }

    res.json({
      success: true,
      data: {
        items: combinedItems,
        pagination: {
          page: parseInt(page, 10) || 1,
          total_pages: Math.max(1, Math.ceil((totalPrimary + filteredMangaDex.length) / 24)),
          total: totalPrimary + filteredMangaDex.length,
        },
        query: q || '',
        sources: {
          primaryCount: primaryItems.length,
          newMangaDexCount: filteredMangaDex.length,
        },
      },
    });
  } catch (err) {
    console.error('[API /search] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to search comics' });
  }
});

// 3. Genres Catalogue
app.get('/api/genres', async (req, res) => {
  try {
    const data = await fetchNextData('genres');
    res.json({
      success: true,
      data: {
        genres: sanitizeData(data.genres || []),
        total: data.catalogueTotal || 0,
      },
    });
  } catch (err) {
    console.error('[API /genres] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch genres' });
  }
});

// 4. Latest Updates
app.get('/api/latest', async (req, res) => {
  try {
    const { page, type, genre } = req.query;
    const queryParams = {};
    if (page) queryParams.page = page;
    if (type) queryParams.type = type;
    if (genre) queryParams.genre = genre;

    const data = await fetchNextData('latest', queryParams);
    res.json({
      success: true,
      data: {
        items: sanitizeData(data.items || []),
        pagination: data.pagination || { page: 1, total_pages: 1, total: 0 },
      },
    });
  } catch (err) {
    console.error('[API /latest] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch latest updates' });
  }
});

// 5. Rankings
app.get('/api/ranking', async (req, res) => {
  try {
    const { type, page } = req.query;
    const queryParams = {};
    if (type) queryParams.type = type;
    if (page) queryParams.page = page;

    const data = await fetchNextData('ranking', queryParams);
    res.json({
      success: true,
      data: {
        items: sanitizeData(data.initialItems || []),
        pagination: data.initialPagination || { page: 1, total_pages: 1, total: 0 },
      },
    });
  } catch (err) {
    console.error('[API /ranking] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch rankings' });
  }
});

// 6. Manga Details (Unified: Comizy + MangaDex)
app.get('/api/manga/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    if (slug.startsWith('md-')) {
      const mangaId = slug.replace('md-', '');
      const mangaData = await MangaDex.getMangaDetails(mangaId);
      return res.json({
        success: true,
        data: mangaData,
      });
    }

    const data = await fetchNextData(slug, { slug });
    if (!data.initialManga) {
      return res.status(404).json({ success: false, error: 'Manga not found' });
    }

    const manga = data.initialManga;

    // Fetch full chapter list from api.comizy.io if manga id is available
    if (manga.id) {
      try {
        const fullChaptersRes = await executeRequest(`https://api.comizy.io/titles/${manga.id}/chapters`);
        if (fullChaptersRes.status === 200) {
          const parsed = JSON.parse(fullChaptersRes.body);
          if (parsed && parsed.data && Array.isArray(parsed.data.chapters) && parsed.data.chapters.length > 0) {
            manga.chapters = parsed.data.chapters.map((ch) => ({
              id: ch.id,
              name: cleanChapterName(ch.name, ch.number),
              slug: ch.slug,
              number: ch.number,
              views: ch.views,
              updatedAt: ch.updated_at || ch.updatedAt,
              cv: ch.cv,
              url: ch.url,
            }));
          }
        }
      } catch (chErr) {
        console.warn(`[API /manga/${slug}] Failed to fetch full chapters from api.comizy.io:`, chErr.message);
      }
    }

    // Clean existing chapters if full fetch was not used
    if (Array.isArray(manga.chapters)) {
      manga.chapters = manga.chapters.map((ch) => ({
        ...ch,
        name: cleanChapterName(ch.name, ch.number),
      }));
    }

    // Compute and attach the true first chapter (Chapter 0/prologue, Chapter 1, or lowest chapter)
    const firstChapter = findFirstChapter(manga.chapters, manga.firstChapter);
    if (firstChapter) {
      manga.firstChapter = {
        id: firstChapter.id,
        name: cleanChapterName(firstChapter.name, firstChapter.number),
        slug: firstChapter.slug,
        url: firstChapter.url,
      };
    }

    manga.chaptersCount = manga.chapters ? manga.chapters.length : 0;
    manga.displayChapters = `${manga.chaptersCount} chapters`;

    res.json({
      success: true,
      data: sanitizeData(manga),
    });
  } catch (err) {
    console.error(`[API /manga/${req.params.slug}] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch manga details' });
  }
});

// 7. Chapter Reader Data (Unified: Comizy + MangaDex)
app.get('/api/chapter/:slug/:chapterSlug', async (req, res) => {
  try {
    const { slug, chapterSlug } = req.params;

    if (slug.startsWith('md-')) {
      const mangaId = slug.replace('md-', '');
      const [manga, pagesData] = await Promise.all([
        MangaDex.getMangaDetails(mangaId),
        MangaDex.getChapterPages(chapterSlug),
      ]);

      const chapters = manga.chapters || [];
      const currentIndex = chapters.findIndex((c) => c.id === chapterSlug || c.slug === chapterSlug);
      const currentChapter = currentIndex !== -1 ? chapters[currentIndex] : { id: chapterSlug, slug: chapterSlug, name: 'Chapter' };

      // In descending order, previous chapter is at currentIndex + 1, next is at currentIndex - 1
      const nextChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
      const previousChapter = currentIndex !== -1 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

      return res.json({
        success: true,
        data: {
          chapter: {
            id: currentChapter.id,
            slug: currentChapter.slug,
            name: currentChapter.name,
            images: pagesData.images,
            pages: pagesData.pages,
          },
          manga: {
            id: manga.id,
            slug: manga.slug,
            name: manga.name,
            cover: manga.cover,
            chapters: manga.chapters,
          },
          nextChapter: nextChapter ? { id: nextChapter.id, slug: nextChapter.slug, name: nextChapter.name } : null,
          previousChapter: previousChapter ? { id: previousChapter.id, slug: previousChapter.slug, name: previousChapter.name } : null,
        },
      });
    }

    const data = await fetchNextData(`${slug}/${chapterSlug}`, {
      slug,
      'chapter-slug': chapterSlug,
    });

    if (!data.initialChapter) {
      return res.status(404).json({ success: false, error: 'Chapter not found' });
    }

    // Process images
    const rawImages = data.initialChapter.images || [];
    const proxiedImages = rawImages.map((img) =>
      typeof img === 'string' ? `/api/proxy/image?url=${encodeURIComponent(img)}` : img
    );

    const chapterResponse = {
      ...data.initialChapter,
      images: proxiedImages,
    };

    res.json({
      success: true,
      data: {
        chapter: sanitizeData(chapterResponse),
        manga: sanitizeData(data.initialManga || {}),
        nextChapter: sanitizeData(data.nextChapter || null),
        previousChapter: sanitizeData(data.previousChapter || null),
      },
    });
  } catch (err) {
    console.error(`[API /chapter/${req.params.slug}/${req.params.chapterSlug}] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch chapter' });
  }
});

// 8. Streaming Image Proxy (Shields identity & bypasses 403 hotlink blocks)
app.get('/api/proxy/image', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Missing url parameter');
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (e) {
    return res.status(400).send('Invalid url parameter');
  }

  const isMangaDex = targetUrl.includes('mangadex.network') || targetUrl.includes('mangadex.org');
  const referer = isMangaDex ? 'https://mangadex.org/' : 'https://comizy.io/';

  const protocol = parsed.protocol === 'https:' ? https : http;
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': referer,
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  };

  const proxyReq = protocol.get(targetUrl, options, (proxyRes) => {
    if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302) {
      const redirectUrl = proxyRes.headers.location;
      if (redirectUrl) {
        return res.redirect(`/api/proxy/image?url=${encodeURIComponent(redirectUrl)}`);
      }
    }

    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'image/webp',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    });

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy Error]:', err.message);
    if (!res.headersSent) {
      res.status(502).send('Proxy error');
    }
  });
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
  if (req.path.startsWith('/app')) {
    return res.sendFile(path.join(__dirname, 'App', 'index.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

process.on('uncaughtException', (err) => {
  console.error('[Server uncaughtException]:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server unhandledRejection]:', reason);
});

// Initialize and start server
app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`  MangaFlow Server running at http://localhost:${PORT}`);
  console.log(`  Branding: MangaFlow`);
  console.log(`===============================================`);
  await getBuildId();

  // Keep-alive self-ping (prevents Render free tier from sleeping)
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL) {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
    setInterval(() => {
      const url = `${RENDER_URL}/api/health`;
      const mod = url.startsWith('https') ? https : http;
      mod.get(url, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => console.log('[KeepAlive] Ping OK'));
      }).on('error', (e) => console.error('[KeepAlive] Ping failed:', e.message));
    }, PING_INTERVAL);
    console.log(`  [KeepAlive] Self-ping enabled (every 14 min)`);
  }
});
