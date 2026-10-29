const { QueryTypes } = require("sequelize");

module.exports = {
  async up(sequelize) {
    const parentTable = await sequelize.query(
      `SELECT to_regclass('public.parent_accounts') AS table_name`,
      { type: QueryTypes.SELECT },
    );
    if (parentTable[0]?.table_name) {
      await sequelize.query(`
        ALTER TABLE parent_accounts ALTER COLUMN email DROP NOT NULL;
      `);
      console.log("  parent_accounts.email column made nullable.");
    }
  },
};
