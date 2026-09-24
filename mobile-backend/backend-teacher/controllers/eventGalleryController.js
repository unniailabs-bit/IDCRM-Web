const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const { sendPushToClass } = require("../../utils/pushNotification");

/**
 * POST - Upload Event Gallery (Single / Multiple Photos)
 * form-data keys:
 *  - event_title
 *  - event_category
 *  - event_date
 *  - class_id
 *  - division_id
 *  - photos (files, single/multiple)
 */
exports.uploadEventGallery = async (req, res) => {
  try {
    const teacher = req.teacher;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { event_title, event_category, event_date, class_id, division_id } = req.body;

    // ✅ Validate required fields
    if (!event_title || !event_category || !event_date || !class_id || !division_id) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // ✅ Check files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "At least one photo is required" });
    }

    // 🔐 Teacher class-division validation using teacher_id
    const access = await sequelize.query(
      `
      SELECT 1
      FROM divisions
      WHERE id = :division_id
        AND class_id = :class_id
        AND teacher_id = :teacherId
      `,
      {
        replacements: {
          division_id,
          class_id,
          teacherId: teacher.id
        },
        type: QueryTypes.SELECT
      }
    );

    if (!access.length) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized class/division access"
      });
    }

    // 1️⃣ Insert event
    const [event] = await sequelize.query(
      `
      INSERT INTO events
      (event_title, event_category, event_date, class_id, division_id, created_by_teacher_id, school_id)
      VALUES (:event_title, :event_category, :event_date, :class_id, :division_id, :teacher_id, :school_id)
      RETURNING *
      `,
      {
        replacements: {
          event_title,
          event_category,
          event_date,
          class_id,
          division_id,
          teacher_id: teacher.id,
          school_id: teacher.school_id
        },
        type: QueryTypes.INSERT
      }
    );

    const event_id = event[0].id;

    // 2️⃣ Insert photos
    const uploadedPhotos = [];
    for (const file of req.files) {
      const photo_url = `/uploads/event-gallery/${file.filename}`;

      const [photo] = await sequelize.query(
        `
        INSERT INTO event_gallery_photos
        (event_id, photo_url, uploaded_by_teacher_id)
        VALUES (:event_id, :photo_url, :teacher_id)
        RETURNING *
        `,
        {
          replacements: { event_id, photo_url, teacher_id: teacher.id },
          type: QueryTypes.INSERT
        }
      );

      uploadedPhotos.push(photo[0]);
    }

    // Notify parents in this class/division (background — does not block response)
    (async () => {
      try {
        const photoCount = uploadedPhotos.length;
        await sendPushToClass(teacher.school_id, class_id, division_id, {
          title: "New Gallery Photos 📸",
          body: `${event_title} — ${photoCount} photo${photoCount === 1 ? "" : "s"} added`,
          data: {
            type: "gallery",
            event_id: String(event_id),
          },
        });
      } catch (pErr) {
        console.error("Push Notification Logic Error (Gallery):", pErr);
      }
    })();

    return res.status(201).json({
      success: true,
      message: "Event gallery uploaded successfully",
      event: event[0],
      photos: uploadedPhotos
    });

  } catch (error) {
    console.error("Upload Event Gallery Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
/**
 * GET - All Event Gallery for Teacher
 * Fetches all events uploaded by the teacher
 * Automatically includes all photos
 */
exports.getEventGallery = async (req, res) => {
  try {
    const teacher = req.teacher;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1️⃣ Fetch all events created by this teacher
    const events = await sequelize.query(
      `
      SELECT 
        e.id AS event_id,
        e.event_title,
        e.event_category,
        e.event_date,
        g.id AS photo_id,
        g.photo_url
      FROM events e
      LEFT JOIN event_gallery_photos g ON g.event_id = e.id
      WHERE e.created_by_teacher_id = :teacher_id
        AND e.school_id = :school_id
        AND e.is_active = true
      ORDER BY e.event_date DESC, g.id ASC
      `,
      {
        replacements: {
          teacher_id: teacher.id,
          school_id: teacher.school_id
        },
        type: QueryTypes.SELECT
      }
    );

    return res.json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error("Get Event Gallery Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


/**
 * DELETE - Delete Event (and its photos via CASCADE)
 */
exports.deleteEvent = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { event_id } = req.params;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const deletedRows = await sequelize.query(
      `
      DELETE FROM events
      WHERE id = :event_id
        AND created_by_teacher_id = :teacher_id
      RETURNING id
      `,
      {
        replacements: { event_id, teacher_id: teacher.id },
        type: QueryTypes.SELECT,
      }
    );

    if (!deletedRows.length) {
      return res.status(404).json({ success: false, message: "Event not found or unauthorized" });
    }

    return res.json({ success: true, message: "Event deleted successfully" });

  } catch (error) {
    console.error("Delete Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
