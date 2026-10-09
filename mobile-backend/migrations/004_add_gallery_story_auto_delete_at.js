module.exports = {
  async up(sequelize) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS auto_delete_at DATE NULL
    `);
    await sequelize.query(`
      ALTER TABLE teacher_stories
      ADD COLUMN IF NOT EXISTS auto_delete_at DATE NULL
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_events_auto_delete_at
      ON events(auto_delete_at)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_teacher_stories_auto_delete_at
      ON teacher_stories(auto_delete_at)
    `);
  }
};