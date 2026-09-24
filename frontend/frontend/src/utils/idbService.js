const DB_NAME = 'IDCardTranslations';
const DB_VERSION = 1;
const STORE_NAME = 'translations';

let dbPromise = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject('IndexedDB open failed');
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Key path is 'id' which will be formatted as "lang:originalText"
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }
  return dbPromise;
};

/**
 * Bulk get translations from IndexedDB
 * @param {string[]} ids - Array of composite keys ("lang:text")
 * @returns {Promise<Record<string, string>>}
 */
export const getCachedTranslations = async (ids) => {
  if (!ids || ids.length === 0) return {};

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const results = {};
      let remaining = ids.length;

      ids.forEach((id) => {
        const request = store.get(id);
        request.onsuccess = (event) => {
          const result = event.target.result;
          if (result) {
            results[id] = result.translation; // Mapping composite key -> translated text
          }
          remaining--;
          if (remaining === 0) resolve(results);
        };
        request.onerror = () => {
          remaining--;
          if (remaining === 0) resolve(results);
        };
      });
    });
  } catch (err) {
    console.error('Error reading from IndexedDB:', err);
    return {};
  }
};

/**
 * Bulk save translations to IndexedDB
 * @param {Array<{id: string, translation: string}>} items
 */
export const saveTranslations = async (items) => {
  if (!items || items.length === 0) return;

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      items.forEach((item) => {
        store.put(item);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    console.error('Error writing to IndexedDB:', err);
  }
};
