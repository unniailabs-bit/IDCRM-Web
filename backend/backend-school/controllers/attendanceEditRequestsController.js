const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");

/**
 * ======================================
 * GET ALL PENDING ATTENDANCE EDIT REQUESTS
 * For the School Admin to review
 * ======================================
 */
exports.getEditRequests = async (req, res) => {
    try {
        const schoolId = Number(req.user?.school_id);
        if (!schoolId || isNaN(schoolId)) {
            return res.status(401).json({ success: false, message: "Unauthorized: School ID not found in session" });
        }

        const { status = 'all', class_id, division_id, month } = req.query;

        let filters = `aer.school_id = :schoolId`;
        const replacements = { schoolId };

        if (status && status !== 'all') {
            filters += ` AND aer.status = :status`;
            replacements.status = status;
        }
        if (class_id && class_id !== 'all') {
            filters += ` AND aer.class_id = :class_id`;
            replacements.class_id = Number(class_id);
        }
        if (division_id && division_id !== 'all') {
            filters += ` AND aer.division_id = :division_id`;
            replacements.division_id = Number(division_id);
        }
        if (month) {
            filters += ` AND TO_CHAR(aer.attendance_date, 'YYYY-MM') = :month`;
            replacements.month = month;
        }

        const requests = await sequelize.query(
            `SELECT
         aer.id,
         aer.teacher_id,
         aer.student_id,
         sf.first_name,
         sf.last_name,
         sf.roll_number,
         aer.division_id,
         d.division_name,
         c.class_name,
         aer.class_id,
         TO_CHAR(aer.attendance_date, 'YYYY-MM-DD') AS attendance_date,
         aer.current_status,
         aer.requested_status,
         aer.status,
         aer.teacher_note,
         aer.admin_note,
         aer.reviewed_at,
         aer.created_at,
         u.name AS teacher_name,
         u.email AS teacher_email
       FROM attendance_edit_requests aer
       JOIN student_forms sf ON aer.student_id = sf.id
       JOIN divisions d ON aer.division_id = d.id
       LEFT JOIN classes c ON aer.class_id = c.id
       LEFT JOIN teachers u ON aer.teacher_id = u.id
       WHERE ${filters}
       ORDER BY aer.created_at DESC`,
            { replacements, type: QueryTypes.SELECT }
        );

        // Also return a summary count
        const [summary] = await sequelize.query(
            `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') AS pending,
         COUNT(*) FILTER (WHERE status = 'approved') AS approved,
         COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
       FROM attendance_edit_requests
       WHERE school_id = :schoolId`,
            { replacements: { schoolId }, type: QueryTypes.SELECT }
        );

        return res.json({ success: true, data: requests, summary: summary || { pending: '0', approved: '0', rejected: '0' } });
    } catch (error) {
        console.error("🔥 Error in getEditRequests:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch edit requests" });
    }
};

/**
 * ======================================
 * APPROVE AN ATTENDANCE EDIT REQUEST
 * Applies the requested change to attendance table
 * ======================================
 */
exports.approveEditRequest = async (req, res) => {
    try {
        const schoolId = Number(req.user?.school_id);
        if (!schoolId || isNaN(schoolId)) {
            return res.status(401).json({ success: false, message: "Unauthorized: School ID not found in session" });
        }
        const adminId = req.user?.id;
        const { id } = req.params;
        const { admin_note } = req.body;

        // Fetch the request; confirm it belongs to this school
        const [request] = await sequelize.query(
            `SELECT * FROM attendance_edit_requests
       WHERE id = :id AND school_id = :schoolId AND status = 'pending'`,
            { replacements: { id, schoolId }, type: QueryTypes.SELECT }
        );

        if (!request) {
            return res.status(404).json({ success: false, message: "Edit request not found or already reviewed" });
        }

        // Apply the attendance change
        await sequelize.query(
            `INSERT INTO attendance (student_id, class_id, division_id, date, status, marked_by, created_at)
       VALUES (:student_id, :class_id, :division_id, :date, :status, :marked_by, NOW())
       ON CONFLICT (student_id, date)
       DO UPDATE SET
         status     = EXCLUDED.status,
         marked_by  = EXCLUDED.marked_by,
         created_at = NOW()`,
            {
                replacements: {
                    student_id: request.student_id,
                    class_id: request.class_id,
                    division_id: request.division_id,
                    date: request.attendance_date,
                    status: request.requested_status,
                    marked_by: request.teacher_id
                }
            }
        );

        // Mark request as approved
        await sequelize.query(
            `UPDATE attendance_edit_requests
       SET status = 'approved',
           admin_note   = :admin_note,
           reviewed_by  = :reviewed_by,
           reviewed_at  = NOW(),
           updated_at   = NOW()
       WHERE id = :id`,
            { replacements: { id, admin_note: admin_note || null, reviewed_by: adminId } }
        );

        return res.json({ success: true, message: "Attendance edit request approved and applied." });
    } catch (error) {
        console.error("🔥 Error in approveEditRequest:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to approve edit request" });
    }
};

/**
 * ======================================
 * REJECT AN ATTENDANCE EDIT REQUEST
 * ======================================
 */
exports.rejectEditRequest = async (req, res) => {
    try {
        const schoolId = Number(req.user?.school_id);
        if (!schoolId || isNaN(schoolId)) {
            return res.status(401).json({ success: false, message: "Unauthorized: School ID not found in session" });
        }
        const adminId = req.user?.id;
        const { id } = req.params;
        const { admin_note } = req.body;

        const [request] = await sequelize.query(
            `SELECT id FROM attendance_edit_requests
       WHERE id = :id AND school_id = :schoolId AND status = 'pending'`,
            { replacements: { id, schoolId }, type: QueryTypes.SELECT }
        );

        if (!request) {
            return res.status(404).json({ success: false, message: "Edit request not found or already reviewed" });
        }

        await sequelize.query(
            `UPDATE attendance_edit_requests
       SET status = 'rejected',
           admin_note  = :admin_note,
           reviewed_by = :reviewed_by,
           reviewed_at = NOW(),
           updated_at  = NOW()
       WHERE id = :id`,
            { replacements: { id, admin_note: admin_note || null, reviewed_by: adminId } }
        );

        return res.json({ success: true, message: "Attendance edit request rejected." });
    } catch (error) {
        console.error("🔥 Error in rejectEditRequest:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to reject edit request" });
    }
};

/**
 * ======================================
 * BULK APPROVE / BULK REJECT
 * ======================================
 */
exports.bulkReviewRequests = async (req, res) => {
    try {
        const schoolId = Number(req.user?.school_id);
        if (!schoolId || isNaN(schoolId)) {
            return res.status(401).json({ success: false, message: "Unauthorized: School ID not found in session" });
        }
        const adminId = req.user?.id;
        const { ids, action, admin_note } = req.body; // action: 'approve' | 'reject'

        if (!Array.isArray(ids) || ids.length === 0 || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: "Invalid bulk review data" });
        }

        // Confirm all belong to this school and are pending
        const validRequests = await sequelize.query(
            `SELECT * FROM attendance_edit_requests
       WHERE id IN (:ids) AND school_id = :schoolId AND status = 'pending'`,
            { replacements: { ids, schoolId }, type: QueryTypes.SELECT }
        );

        if (!validRequests.length) {
            return res.status(404).json({ success: false, message: "No valid pending requests found" });
        }

        if (action === 'approve') {
            // Apply all attendance changes
            for (const request of validRequests) {
                await sequelize.query(
                    `INSERT INTO attendance (student_id, class_id, division_id, date, status, marked_by, created_at)
           VALUES (:student_id, :class_id, :division_id, :date, :status, :marked_by, NOW())
           ON CONFLICT (student_id, date)
           DO UPDATE SET
             status     = EXCLUDED.status,
             marked_by  = EXCLUDED.marked_by,
             created_at = NOW()`,
                    {
                        replacements: {
                            student_id: request.student_id,
                            class_id: request.class_id,
                            division_id: request.division_id,
                            date: request.attendance_date,
                            status: request.requested_status,
                            marked_by: request.teacher_id
                        }
                    }
                );
            }
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        await sequelize.query(
            `UPDATE attendance_edit_requests
       SET status = :newStatus,
           admin_note  = :admin_note,
           reviewed_by = :reviewed_by,
           reviewed_at = NOW(),
           updated_at  = NOW()
       WHERE id IN (:ids)`,
            { replacements: { ids, newStatus, admin_note: admin_note || null, reviewed_by: adminId } }
        );

        return res.json({
            success: true,
            message: `${validRequests.length} request(s) ${newStatus}.`
        });
    } catch (error) {
        console.error("🔥 Error in bulkReviewRequests:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to bulk review requests" });
    }
};
