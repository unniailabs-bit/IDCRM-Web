import axiosInstance from '@/api/axiosInstance';
import { CARD_WIDTH_MM, CARD_HEIGHT_MM, DEFAULT_CARD_GAP_MM, getPageLayout } from './utils';

// ID card templates live on the server (per school) so they follow the user across
// devices and browsers. Only the *selected* template id is kept in localStorage, as a
// per-device convenience.
const API_BASE = '/api/school/id-card-templates';

const LEGACY_LIST_KEY = 'id_card_templates';
const LEGACY_ACTIVE_KEY = 'id_card_template';
const ACTIVE_ID_KEY = 'id_card_active_template_id';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fills in every card size / print layout field so it is always saved, exported and
 * imported with the template (older templates simply don't have them yet).
 */
export const normalizeTemplate = (template) => {
  const base = {
    ...template,
    orientation: template?.orientation === 'vertical' ? 'vertical' : 'horizontal',
    cardWidthMm: Number(template?.cardWidthMm) || CARD_WIDTH_MM,
    cardHeightMm: Number(template?.cardHeightMm) || CARD_HEIGHT_MM,
    cardGapMm: Number(template?.cardGapMm ?? DEFAULT_CARD_GAP_MM),
  };
  // Resolves "unset" to the real number and caps it to what fits on the page
  base.cardsPerPage = getPageLayout(base).cardsPerPage;
  return base;
};

export const getActiveTemplateId = () => {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY) || null;
  } catch {
    return null;
  }
};

export const setActiveTemplateId = (id) => {
  try {
    if (id) localStorage.setItem(ACTIVE_ID_KEY, id);
  } catch {
    /* ignore: storage unavailable */
  }
};

export const fetchTemplates = async () => {
  const res = await axiosInstance.get(API_BASE);
  return res.data?.data || [];
};

/** Creates or updates a template on the server. Returns the saved template. */
export const saveTemplateRemote = async (template) => {
  const toSave = normalizeTemplate(template);
  const res = await axiosInstance.put(`${API_BASE}/${toSave.id}`, toSave);
  return res.data.data;
};

export const deleteTemplateRemote = async (id) => {
  await axiosInstance.delete(`${API_BASE}/${id}`);
};

const readLegacyTemplates = () => {
  try {
    const list = JSON.parse(localStorage.getItem(LEGACY_LIST_KEY) || '[]');
    const templates = Array.isArray(list) ? [...list] : [];

    // The old single-template key could hold a template that was never in the list
    const single = JSON.parse(localStorage.getItem(LEGACY_ACTIVE_KEY) || 'null');
    if (single && Array.isArray(single.elements) && !templates.some((t) => t.id && t.id === single.id)) {
      templates.push(single);
    }
    return templates.filter((t) => t && Array.isArray(t.elements));
  } catch {
    return [];
  }
};

const clearLegacyTemplates = () => {
  try {
    localStorage.removeItem(LEGACY_LIST_KEY);
    localStorage.removeItem(LEGACY_ACTIVE_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * One-time move of templates previously kept in this browser's localStorage up to the
 * server. Templates the server already has (same id) are left untouched. The local copy
 * is removed only after everything was uploaded, so nothing is lost if a request fails.
 */
const migrateLegacyTemplates = async (serverTemplates) => {
  const legacy = readLegacyTemplates();
  if (legacy.length === 0) return serverTemplates;

  const known = new Set(serverTemplates.map((t) => t.id));
  const uploaded = [];
  let allOk = true;

  for (const t of legacy) {
    const id = UUID_RE.test(t.id || '') ? t.id : crypto.randomUUID();
    if (known.has(id)) continue;
    try {
      uploaded.push(
        await saveTemplateRemote({ ...t, id, name: t.name || 'Migrated Template' })
      );
      known.add(id);
    } catch (e) {
      allOk = false;
      console.error('Failed to migrate template to server:', t.name, e);
    }
  }

  if (allOk) clearLegacyTemplates();
  return [...uploaded, ...serverTemplates];
};

// Shared by concurrent callers (e.g. React StrictMode mounting twice) so the one-time
// migration can't upload the same local templates twice
let loadInFlight = null;

/** Loads this school's templates (newest first), migrating any old local ones first. */
export const loadTemplates = () => {
  if (!loadInFlight) {
    loadInFlight = (async () => {
      const serverTemplates = await fetchTemplates();
      const all = await migrateLegacyTemplates(serverTemplates);
      return all.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
    })().finally(() => {
      loadInFlight = null;
    });
  }
  return loadInFlight;
};
