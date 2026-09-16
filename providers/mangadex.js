const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'MangaFlow/2.0 (Open Manga Reader)',
          'Accept': 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode >= 400) {
              return reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 100)}`));
            }
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
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

function cleanChapterName(name) {
  if (!name || typeof name !== 'string') return 'Chapter';
  let str = name;
  // Remove brackets with scanlator group names
  str = str.replace(/\[[^\]]*(?:scans?|team|translation|group|comics?|raw|hd)[^\]]*\]/gi, '');
  // Remove domain names or URLs in parentheses
  str = str.replace(/\([^\)]*(?:\.com|\.net|\.org|\.io|\.gg|\.me)[^\)]*\)/gi, '');
  // Remove promo suffixes
  str = str.replace(/\s*[-–—]\s*(?:read\s+at|visit|free\s+on).*/gi, '');
  return str.trim() || name;
}

function getTitle(attributes) {
  if (!attributes || !attributes.title) return 'Unknown Title';
  const t = attributes.title;
  return t.en || t['ja-ro'] || t.ja || t['ko-ro'] || t.ko || Object.values(t)[0] || 'Unknown Title';
}

function getCoverUrl(mangaId, relationships) {
  const coverRel = (relationships || []).find((r) => r.type === 'cover_art');
  if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
    return `https://uploads.mangadex.org/covers/${mangaId}/${coverRel.attributes.fileName}.512.jpg`;
  }
  return 'https://uploads.mangadex.org/covers/' + mangaId;
}

const MangaDex = {
  // 1. Search Manga
  async search(query = '', options = {}) {
    const limit = options.limit || 24;
    const offset = ((options.page || 1) - 1) * limit;

    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('offset', offset);
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.append('hasAvailableChapters', 'true');
    params.append('availableTranslatedLanguage[]', 'en');

    if (query) {
      params.append('title', query);
    } else {
      params.append('order[followedCount]', 'desc');
    }

    if (options.sort === 'views_today' || options.sort === 'popular') {
      params.append('order[followedCount]', 'desc');
    } else if (options.sort === 'newest') {
      params.append('order[createdAt]', 'desc');
    } else if (options.sort === 'updated') {
      params.append('order[latestUploadedChapter]', 'desc');
    }

    const url = `https://api.mangadex.org/manga?${params.toString()}`;
    const res = await fetchJson(url);
    const items = (res.data || []).map((item) => {
      const cover = getCoverUrl(item.id, item.relationships);
      const title = getTitle(item.attributes);
      const authorRel = (item.relationships || []).find((r) => r.type === 'author');
      const rawSummary = item.attributes?.description?.en || '';

      return {
        id: item.id,
        slug: `md-${item.id}`,
        name: title,
        cover: `/api/proxy/image?url=${encodeURIComponent(cover)}`,
        status: item.attributes?.status || 'ongoing',
        rating: 4.8,
        displayRating: '4.8',
        displayViews: `${Math.floor((item.attributes?.followedCount || 1000) / 100) / 10}K`,
        displayChapters: 'Manga',
        isHot: true,
        source: 'mangadex',
        summary: cleanText(rawSummary),
        authors: authorRel ? [{ name: authorRel.attributes?.name || 'Author' }] : [],
      };
    });

    return {
      items,
      total: res.total || items.length,
      limit,
      offset,
    };
  },

  // 2. Get Manga Details & Chapter List
  async getMangaDetails(id) {
    const url = `https://api.mangadex.org/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`;
    const res = await fetchJson(url);
    const item = res.data;
    if (!item) throw new Error('Manga not found');

    const title = getTitle(item.attributes);
    const cover = getCoverUrl(item.id, item.relationships);
    const authorRel = (item.relationships || []).find((r) => r.type === 'author');
    const rawSummary = item.attributes?.description?.en || 'Read this classic manga series on MangaFlow.';

    // Fetch chapters (English, up to 300 chapters)
    const chaptersUrl = `https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=300`;
    const chaptersRes = await fetchJson(chaptersUrl);

    // Group and format chapters
    const chapters = (chaptersRes.data || []).map((ch) => {
      const num = parseFloat(ch.attributes?.chapter) || 0;
      const chTitle = ch.attributes?.title;
      const rawName = `Chapter ${ch.attributes?.chapter || '0'}${chTitle ? ': ' + chTitle : ''}`;

      return {
        id: ch.id,
        slug: ch.id,
        name: cleanChapterName(rawName),
        number: num,
        views: ch.attributes?.pages || 20,
        updatedAt: ch.attributes?.publishAt || ch.attributes?.createdAt,
      };
    });

    // Genres / Tags
    const genres = (item.attributes?.tags || []).map((tag) => ({
      id: tag.id,
      name: tag.attributes?.name?.en || 'Tag',
      slug: (tag.attributes?.name?.en || '').toLowerCase().replace(/\s+/g, '-'),
    }));

    return {
      id: item.id,
      slug: `md-${item.id}`,
      name: title,
      altName: Object.values(item.attributes?.altTitles?.[0] || {})[0] || '',
      cover: `/api/proxy/image?url=${encodeURIComponent(cover)}`,
      status: item.attributes?.status || 'ongoing',
      type: 'manga',
      rating: 4.9,
      ratingsCount: 520,
      displayViews: '250K+',
      displayBookmarks: '18K',
      summary: cleanText(rawSummary),
      authors: authorRel ? [{ name: authorRel.attributes?.name || 'Manga Artist' }] : [],
      genres,
      chapters,
      source: 'mangadex',
    };
  },

  // 3. Get Chapter Pages
  async getChapterPages(chapterId) {
    const url = `https://api.mangadex.org/at-home/server/${chapterId}`;
    const res = await fetchJson(url);
    const baseUrl = res.baseUrl;
    const hash = res.chapter?.hash;
    const pageFiles = res.chapter?.data || [];

    const images = pageFiles.map((f) => {
      const fullUrl = `${baseUrl}/data/${hash}/${f}`;
      return `/api/proxy/image?url=${encodeURIComponent(fullUrl)}`;
    });

    return {
      images,
      pages: images.length,
    };
  },
};

module.exports = MangaDex;
