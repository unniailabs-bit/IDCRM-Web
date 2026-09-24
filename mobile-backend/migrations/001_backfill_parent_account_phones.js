const { QueryTypes } = require("sequelize");

const PHONE_EXPR = (column) =>
  `RIGHT(REGEXP_REPLACE(COALESCE(${column}, ''), '[^0-9]', '', 'g'), 10)`;

/**
 * Backfill parent_accounts.phone from linked student father_phone for phone-based login.
 */
module.exports = {
  async up(sequelize) {
    const tableExists = await sequelize.query(
      `SELECT to_regclass('public.parent_accounts') AS table_name`,
      { type: QueryTypes.SELECT },
    );
    if (!tableExists[0]?.table_name) {
      console.log("  parent_accounts table not found — skipping backfill.");
      return;
    }

    const [, meta] = await sequelize.query(
      `
      UPDATE parent_accounts pa
      SET phone = src.normalized_phone,
          updated_at = NOW()
      FROM (
        SELECT DISTINCT ON (pa2.id)
          pa2.id AS parent_account_id,
          ${PHONE_EXPR("sf.father_phone")} AS normalized_phone
        FROM parent_accounts pa2
        JOIN parent_student_links psl ON psl.parent_account_id = pa2.id
        JOIN student_forms sf ON sf.id = psl.student_form_id
        WHERE sf.father_phone IS NOT NULL
          AND TRIM(sf.father_phone) <> ''
          AND LENGTH(${PHONE_EXPR("sf.father_phone")}) = 10
        ORDER BY pa2.id, sf.id ASC
      ) src
      WHERE pa.id = src.parent_account_id
        AND (
          pa.phone IS NULL
          OR TRIM(pa.phone) = ''
          OR ${PHONE_EXPR("pa.phone")} <> src.normalized_phone
        )
      `,
    );

    console.log(`  Backfilled parent_accounts.phone (${meta?.rowCount ?? 0} row(s)).`);

    const [, teacherMeta] = await sequelize.query(
      `
      UPDATE teachers
      SET phone = ${PHONE_EXPR("phone")},
          updated_at = NOW()
      WHERE phone IS NOT NULL
        AND TRIM(phone) <> ''
        AND phone <> ${PHONE_EXPR("phone")}
      `,
    );

    console.log(`  Normalized teachers.phone (${teacherMeta?.rowCount ?? 0} row(s)).`);
  },
};
