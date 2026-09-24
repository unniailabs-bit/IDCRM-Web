/**
 * Simple client-side translation using Google Translate API (via vite proxy)
 * NOTE: This relies on the '/translate-api' proxy being configured in vite.config.ts
 *
 * Modified to use IndexedDB for long-term storage (Scalable to millions of records)
 */

import { getCachedTranslations, saveTranslations } from './idbService';

const CACHE_KEY = 'translation_cache_v3'; // Legacy key for migration check
let memCache = {}; // In-memory cache for current session speed

// --- MIGRATION CHECK ---
// Check if user has old localStorage data and migrate it to IndexedDB once
(async () => {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      console.log('Migrating translation cache from LocalStorage to IndexedDB...');
      const parsed = JSON.parse(saved);
      const itemsToSave = [];

      Object.keys(parsed).forEach((lang) => {
        Object.keys(parsed[lang]).forEach((originalText) => {
          itemsToSave.push({
            id: `${lang}:${originalText}`,
            translation: parsed[lang][originalText],
          });
        });
      });

      if (itemsToSave.length > 0) {
        await saveTranslations(itemsToSave);
        console.log(`Migrated ${itemsToSave.length} translations.`);
      }

      // Clear old storage to free up space
      localStorage.removeItem(CACHE_KEY);
    }
  } catch (e) {
    console.error('Migration failed', e);
  }
})();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Translates a batch of texts to the target language
 * @param {string[]} texts
 * @param {string} targetLang - 'mr', 'hi', 'en', etc.
 * @returns {Promise<Record<string, string>>}
 */
/**
 * Translates a batch of texts to the target language
 * @param {string[]} texts
 * @param {string} targetLang - 'mr', 'hi', 'en', etc.
 * @param {function(number):void} [onProgress] - Optional callback for progress (0 to 1)
 * @returns {Promise<Record<string, string>>}
 */
export async function translateBatch(texts, targetLang = 'mr', onProgress) {
  // Ensure in-memory cache for this language exists
  if (!memCache[targetLang]) {
    memCache[targetLang] = {};
  }

  const result = {};
  const neededFromDB = [];

  // Stage 1: Check In-Memory Cache (Fastest)
  texts.forEach((text) => {
    if (!text || typeof text !== 'string' || text.trim() === '') return;
    const cleanText = text.trim();

    if (memCache[targetLang][cleanText]) {
      result[cleanText] = memCache[targetLang][cleanText];
    } else {
      // If not in memory, we need to check DB
      if (!neededFromDB.includes(cleanText)) {
        neededFromDB.push(cleanText);
      }
    }
  });

  if (neededFromDB.length === 0) {
    if (onProgress) onProgress(1);
    return result;
  }

  // Stage 2: Check IndexedDB (Asynchronous, Scalable)
  const dbKeys = neededFromDB.map((t) => `${targetLang}:${t}`);
  const dbResults = await getCachedTranslations(dbKeys);

  const neededFromAPI = [];

  // Process DB results
  neededFromDB.forEach((originalText) => {
    const dbKey = `${targetLang}:${originalText}`;
    if (dbResults && dbResults[dbKey]) {
      // Found in DB! Add to memory cache and result
      memCache[targetLang][originalText] = dbResults[dbKey];
      result[originalText] = dbResults[dbKey];
    } else {
      // Not in DB, need to fetch from Google
      if (!neededFromAPI.includes(originalText)) {
        neededFromAPI.push(originalText);
      }
    }
  });

  if (neededFromAPI.length === 0) {
    if (onProgress) onProgress(1);
    return result;
  }

  // Stage 3: Fetch from API (Slowest)
  const CHUNK_SIZE = 30; // Batch size for API

  const PROXIES = [
    // PRIMARY: HTML-based proxy (CodeTabs) - Currently most reliable (Status 200)
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,

    // FALLBACK 1: AllOrigins JSON Wrapper (Currently hitting 5xx errors)
    (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,

    // FALLBACK 2: ThingProxy
    (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
  ];

  let processedCount = 0;
  const totalChunks = Math.ceil(neededFromAPI.length / CHUNK_SIZE);

  for (let i = 0; i < neededFromAPI.length; i += CHUNK_SIZE) {
    const chunk = neededFromAPI.slice(i, i + CHUNK_SIZE);

    let attempts = 0;
    let success = false;

    while (attempts < PROXIES.length * 2 && !success) {
      try {
        const proxyIndex = attempts % PROXIES.length;
        attempts++;

        const q = chunk.join('\n');

        let url;
        const targetUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(
          q
        )}`;

        if (import.meta.env.DEV) {
          // Development: Use Vite proxy
          url = `/translate-api/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(
            q
          )}`;
        } else {
          // Production: Use Rotating CORS Proxy
          url = PROXIES[proxyIndex](targetUrl);
        }

        const response = await fetch(url);

        if (!response.ok) {
          // If 429/403/500, switch
          if ([429, 403, 500, 503].includes(response.status)) {
            console.warn(`Proxy ${proxyIndex} failed with ${response.status}. Switching...`);
            await delay(500);
            continue;
          }
          throw new Error(`Network response was not ok: ${response.status}`);
        }

        let data = await response.json();

        // SPECIAL HANDLING FOR ALLORIGINS WRAPPED RESPONSE
        if (data.contents && data.status) {
          // The actual response text is inside 'contents' as a string
          try {
            data = JSON.parse(data.contents);
          } catch (e) {
            // If it's not JSON, it might be an error page
            throw new Error('AllOrigins proxy returned non-JSON content');
          }
        }

        if (!Array.isArray(data)) {
          throw new Error('Invalid response format (not an array)');
        }

        if (data && data[0]) {
          console.log(
            `%c[Translation] Success via Proxy ${proxyIndex} (${
              import.meta.env.DEV ? 'Local' : 'Public'
            })`,
            'color: green; font-weight: bold;'
          );

          const fullTranslation = data[0].map((item) => item[0]).join('');
          const translatedLines = fullTranslation.split('\n');

          const itemsToSaveToDB = [];

          chunk.forEach((original, index) => {
            const trans = translatedLines[index] || original;
            const cleanTrans = trans.trim();

            result[original] = cleanTrans;
            memCache[targetLang][original] = cleanTrans;

            itemsToSaveToDB.push({
              id: `${targetLang}:${original}`,
              translation: cleanTrans,
            });
          });

          await saveTranslations(itemsToSaveToDB);
        }
        success = true;
      } catch (err) {
        console.error(`Translation attempt ${attempts} failed for chunk`, err);
        if (attempts >= PROXIES.length * 2) {
          console.error('%c[Translation] All proxies failed for this chunk.', 'color: red;');
          chunk.forEach((t) => (result[t] = t));
        } else {
          await delay(1000);
        }
      }
    }

    processedCount++;
    if (onProgress) {
      onProgress(processedCount / totalChunks);
    }
  }

  return result;
}
