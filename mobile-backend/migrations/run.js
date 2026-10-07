/**
 * Database migration runner.
 * Usage: node migrations/run.js
 * Also runs automatically on server startup (see server.js).
 *
 * Tracks applied migrations in schema_migrations.
 * Add new files as 00N_description.js (sorted by name).
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { QueryTypes } = require("sequelize");
const sequelize = require("../config/db");

// Arbitrary constant key so concurrent instances (e.g. Cloud Run scale-out)
// don't run the same migration twice
const MIGRATION_LOCK_KEY = 727001;

async function ensureMigrationsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations() {
  const rows = await sequelize.query(
    `SELECT name FROM schema_migrations ORDER BY id ASC`,
    { type: QueryTypes.SELECT },
  );
  return new Set(rows.map((row) => row.name));
}

async function applyPending() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const dir = __dirname;
  const files = fs
    .readdirSync(dir)
    .filter((file) => /^\d{3}_.+\.js$/.test(file))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skip (already applied): ${file}`);
      continue;
    }

    console.log(`Running: ${file}`);
    const migration = require(path.join(dir, file));
    if (typeof migration.up !== "function") {
      throw new Error(`Migration ${file} must export an up(sequelize) function`);
    }

    await migration.up(sequelize);
    await sequelize.query(
      `INSERT INTO schema_migrations (name) VALUES (:name)`,
      { replacements: { name: file }, type: QueryTypes.INSERT },
    );
    console.log(`Applied: ${file}`);
    ran++;
  }

  console.log(ran === 0 ? "All migrations up to date." : `Completed ${ran} migration(s).`);
}

/**
 * Applies pending migrations. Throws on failure.
 * Holds a transaction-scoped advisory lock for the duration so only one
 * instance migrates at a time; others wait, then see everything applied.
 */
async function runMigrations() {
  await sequelize.transaction(async (transaction) => {
    await sequelize.query(`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`, { transaction });
    await applyPending();
  });
}

module.exports = { runMigrations };

// CLI: node migrations/run.js
if (require.main === module) {
  runMigrations()
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}
