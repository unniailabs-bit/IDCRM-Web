const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Created lazily on first use so no separate migration step is needed on deploy
let tableReady = null;
const ensureTable = () => {
  if (!tableReady) {
    tableReady = (async () => {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS school_id_card_templates (
          id UUID PRIMARY KEY,
          school_id BIGINT NOT NULL,
          name VARCHAR(255) NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_school_id_card_templates_school ON school_id_card_templates(school_id)`
      );
    })().catch((err) => {
      tableReady = null; // retry on next request
      throw err;
    });
  }
  return tableReady;
};

const inRange = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;

// Returns the cleaned template to store, or throws an Error with a user-facing message
const sanitizeTemplate = (body) => {
  if (!body || typeof body !== 'object') throw new Error('Template body is required');
  if (!Array.isArray(body.elements)) throw new Error('Template must contain an elements array');

  const name = String(body.name || '').trim();
  if (!name) throw new Error('Template name is required');
  if (name.length > 255) throw new Error('Template name is too long');

  const data = { ...body, name };
  // These are stored inside `data`; the row columns are the source of truth for them
  delete data.id;
  delete data.lastModified;

  if (data.orientation !== 'vertical') data.orientation = 'horizontal';

  // Card size / print layout (mm). Reject nonsense rather than silently storing it.
  for (const key of ['cardWidthMm', 'cardHeightMm']) {
    if (data[key] !== undefined && data[key] !== null) {
      data[key] = Number(data[key]);
      if (!inRange(data[key], 10, 500)) throw new Error(`${key} must be between 10 and 500 mm`);
    }
  }
  if (data.cardGapMm !== undefined && data.cardGapMm !== null) {
    data.cardGapMm = Number(data.cardGapMm);
    if (!inRange(data.cardGapMm, 0, 100)) throw new Error('cardGapMm must be between 0 and 100 mm');
  }
  if (data.cardsPerPage !== undefined && data.cardsPerPage !== null) {
    data.cardsPerPage = parseInt(data.cardsPerPage, 10);
    if (!inRange(data.cardsPerPage, 1, 200)) throw new Error('cardsPerPage must be between 1 and 200');
  }
  return data;
};

const rowToTemplate = (row) => ({
  ...row.data,
  id: row.id,
  name: row.name,
  created: new Date(row.created_at).getTime(),
  lastModified: new Date(row.updated_at).getTime(),
});

// GET /api/school/id-card-templates
exports.listTemplates = async (req, res) => {
  try {
    await ensureTable();
    const rows = await sequelize.query(
      `SELECT id, name, data, created_at, updated_at
       FROM school_id_card_templates
       WHERE school_id = :school_id
       ORDER BY updated_at DESC`,
      { replacements: { school_id: req.user.school_id }, type: QueryTypes.SELECT }
    );
    return res.json({ success: true, data: rows.map(rowToTemplate) });
  } catch (error) {
    console.error('List ID card templates error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load templates' });
  }
};

// PUT /api/school/id-card-templates/:id  (create or update)
exports.saveTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' });
    }

    let data;
    try {
      data = sanitizeTemplate(req.body);
    } catch (validationError) {
      return res.status(400).json({ success: false, message: validationError.message });
    }

    await ensureTable();

    // Upsert, but never let one school overwrite another school's template with the same id
    const rows = await sequelize.query(
      `INSERT INTO school_id_card_templates (id, school_id, name, data)
       VALUES (:id, :school_id, :name, CAST(:data AS JSONB))
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name, data = EXCLUDED.data, updated_at = NOW()
         WHERE school_id_card_templates.school_id = EXCLUDED.school_id
       RETURNING id, name, data, created_at, updated_at`,
      {
        replacements: {
          id,
          school_id: req.user.school_id,
          name: data.name,
          data: JSON.stringify(data),
        },
        type: QueryTypes.SELECT,
      }
    );

    if (!rows.length) {
      return res.status(403).json({ success: false, message: 'Template belongs to another school' });
    }
    return res.json({ success: true, data: rowToTemplate(rows[0]) });
  } catch (error) {
    console.error('Save ID card template error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save template' });
  }
};

// DELETE /api/school/id-card-templates/:id
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' });
    }
    await ensureTable();
    await sequelize.query(
      `DELETE FROM school_id_card_templates WHERE id = :id AND school_id = :school_id`,
      { replacements: { id, school_id: req.user.school_id }, type: QueryTypes.DELETE }
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete ID card template error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
};
