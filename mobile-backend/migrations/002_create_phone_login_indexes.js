const { QueryTypes } = require("sequelize");

const PHONE_EXPR = (column) =>
  `RIGHT(REGEXP_REPLACE(COALESCE(${column}, ''), '[^0-9]', '', 'g'), 10)`;

/**
 * Indexes to speed up phone-based login lookups.
 */
module.exports = {
  async up(sequelize) {
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_teachers_phone_normalized
      ON teachers (${PHONE_EXPR("phone")})
      WHERE status = 'Active' AND phone IS NOT NULL AND TRIM(phone) <> ''
    `);

    const parentTable = await sequelize.query(
      `SELECT to_regclass('public.parent_accounts') AS table_name`,
      { type: QueryTypes.SELECT },
    );
    if (parentTable[0]?.table_name) {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_parent_accounts_phone_normalized
        ON parent_accounts (${PHONE_EXPR("phone")})
        WHERE phone IS NOT NULL AND TRIM(phone) <> ''
      `);
    }

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_student_forms_father_phone_normalized
      ON student_forms (${PHONE_EXPR("father_phone")})
      WHERE father_phone IS NOT NULL AND TRIM(father_phone) <> ''
    `);

    console.log("  Phone login indexes created (if not present).");
  },
};
