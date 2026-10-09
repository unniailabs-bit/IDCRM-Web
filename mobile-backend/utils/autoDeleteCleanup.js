const fs = require("fs");
const path = require("path");
const { QueryTypes } = require("sequelize");
const sequelize = require("../config/db");

function getStoredFilePaths(url) {
  if (typeof url !== "string") return [];

  const match = url.match(/^\/uploads\/(event-gallery|stories)\/([^/\\]+)$/);
  if (!match) return [];

  const [, folder, filename] = match;
  return [
    path.join(__dirname, "..", "uploads", folder, filename),
    path.join(__dirname, "..", "backend-teacher", "uploads", folder, filename),
    path.resolve(process.cwd(), "uploads", folder, filename)
  ];
}

async function cleanupExpiredUploads() {
  const galleryFiles = await sequelize.query(
    `SELECT p.photo_url
     FROM event_gallery_photos p
     JOIN events e ON e.id = p.event_id
    WHERE e.auto_delete_at < CURRENT_DATE`,
    { type: QueryTypes.SELECT }
  );
  const storyFiles = await sequelize.query(
    `SELECT media_url
     FROM teacher_stories
    WHERE auto_delete_at < CURRENT_DATE AND media_url IS NOT NULL`,
    { type: QueryTypes.SELECT }
  );

  await sequelize.query(
    `DELETE FROM event_gallery_photos
    WHERE event_id IN (SELECT id FROM events WHERE auto_delete_at < CURRENT_DATE)`
  );
  const deletedEvents = await sequelize.query(
    `DELETE FROM events WHERE auto_delete_at < CURRENT_DATE RETURNING id`,
    { type: QueryTypes.SELECT }
  );
  const deletedStories = await sequelize.query(
    `DELETE FROM teacher_stories WHERE auto_delete_at < CURRENT_DATE RETURNING id`,
    { type: QueryTypes.SELECT }
  );

  for (const row of [...galleryFiles, ...storyFiles]) {
    for (const filePath of getStoredFilePaths(row.photo_url || row.media_url)) {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (error) {
        console.warn("Could not remove expired upload file:", filePath, error.message);
      }
    }
  }

  if (deletedEvents.length || deletedStories.length) {
    console.log(`Auto-delete removed ${deletedEvents.length} gallery event(s) and ${deletedStories.length} story row(s).`);
  }
}

function startAutoDeleteCleanup() {
  const runCleanup = () => {
    cleanupExpiredUploads().catch((error) => {
      console.error("Auto-delete cleanup failed:", error.message);
    });
  };

  runCleanup();
  const timer = setInterval(runCleanup, 60 * 60 * 1000);
  timer.unref();
}

module.exports = { cleanupExpiredUploads, startAutoDeleteCleanup };