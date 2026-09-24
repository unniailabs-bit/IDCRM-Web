const express = require('express');
const router = express.Router();
const sequelize = require('../../config/db');
const { QueryTypes } = require('sequelize');
const { publicApiLimiter } = require('../../middleware/rateLimiter');

// ✅ Public QR verification route: GET /api/student/:form_token
router.get('/:form_token', publicApiLimiter, async (req, res) => {
    try {
        const { form_token } = req.params;

        if (!form_token) {
            return res.status(400).json({
                success: false,
                message: "Form token is required"
            });
        }

        const students = await sequelize.query(
            `SELECT sf.id, sf.first_name, sf.middle_name, sf.last_name, sf.dob, sf.gender, sf.blood_group, sf.photo, 
              sf.father_name, sf.mother_name, sf.school_id, sf.roll_number, sf.status, sf.id_number, 
              sf.gr_number, sf.father_phone, sf.mother_phone, sf.form_token,
              sf.street_address, sf.city, sf.state, sf.pin_code,
              d.division_name, c.class_name,
              s.school_name, s.logo AS school_logo, s.address AS school_address, s.state AS school_state
             FROM student_forms sf
             LEFT JOIN schools s ON sf.school_id = s.id
             LEFT JOIN divisions d ON sf.division_id = d.id
             LEFT JOIN classes c ON d.class_id = c.id
             WHERE sf.form_token = :token AND sf.status = 'approved'`,
            {
                replacements: { token: form_token },
                type: QueryTypes.SELECT,
            }
        );

        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found or not approved"
            });
        }

        let student = students[0];

        // Format absolute URLs for dynamic photo and school logo
        const mainBackendUrl = process.env.BACKEND_URL || "";
        let photoUrl = student.photo || null;
        if (photoUrl && photoUrl.startsWith("/")) {
            photoUrl = `${mainBackendUrl}${photoUrl}`;
        }

        let schoolLogoUrl = student.school_logo || null;
        if (schoolLogoUrl && schoolLogoUrl.startsWith("/")) {
            schoolLogoUrl = `${mainBackendUrl}${schoolLogoUrl}`;
        }

        // Filter sensitive data - only return fields necessary for verification
        const publicData = {
            id: student.id,
            first_name: student.first_name,
            middle_name: student.middle_name,
            last_name: student.last_name,
            photo: photoUrl,
            blood_group: student.blood_group,
            address: `${student.street_address || ''}, ${student.city || ''}, ${student.state || ''} - ${student.pin_code || ''}`.replace(/^, |, $/, ''),
            school_id: student.school_id,
            class_name: student.class_name,
            division_name: student.division_name,
            roll_number: student.roll_number,
            id_number: student.id_number,
            gr_number: student.gr_number,
            father_name: student.father_name,
            mother_name: student.mother_name,
            father_phone: student.father_phone,
            mother_phone: student.mother_phone,
            status: student.status,
            form_token: student.form_token,
            school_name: student.school_name,
            school_logo: schoolLogoUrl,
            school_address: student.school_address,
            school_state: student.school_state
        };

        return res.json({
            success: true,
            data: publicData
        });

    } catch (error) {
        console.error("Error fetching student by QR:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;
