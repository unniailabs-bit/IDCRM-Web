const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");

/**
 * Dynamic calculation of Academic Year & Valid Until date based on standard June-May school session
 */
function getAcademicValidity(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1 = Jan, 6 = June
    const startYear = month >= 6 ? year : year - 1;
    const endYear = startYear + 1;

    return {
        academic_year: `${startYear} - ${String(endYear).slice(-2)}`,
        academic_year_full: `${startYear} - ${endYear}`,
        valid_until: `31/05/${endYear}`,
        valid_until_iso: `${endYear}-05-31`
    };
}

/**
 * ✅ Student dashboard: Fetch own details and return for digital ID card
 * Login student can see own data + QR code
 */
exports.getMyDigitalId = async (req, res) => {
    try {
        const user = req.student || req.parent;

        if (!user || user.id === undefined) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User information missing"
            });
        }

        const studentId = user.id;

        const query = `
            SELECT 
                sf.*,
                COALESCE(d.class_name, c.class_name) AS class_name,
                d.division_name,
                s.school_name,
                s.logo AS school_logo,
                s.address AS school_address,
                s.state AS school_state
            FROM student_forms sf
            LEFT JOIN divisions d ON sf.division_id = d.id
            LEFT JOIN classes c ON COALESCE(d.class_id, sf.class_id) = c.id
            LEFT JOIN schools s ON sf.school_id = s.id
            WHERE sf.id = :studentId AND sf.status = 'approved'
            LIMIT 1
        `;

        const students = await sequelize.query(query, {
            replacements: { studentId },
            type: QueryTypes.SELECT
        });

        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found or not approved"
            });
        }

        let student = students[0];

        // Remove password before sending
        delete student.password;

        const mainBackendUrl = process.env.MAIN_BACKEND_URL || "";
        if (student.photo && student.photo.startsWith("/")) {
            student.photo = `${mainBackendUrl}${student.photo}`;
        }
        if (student.school_logo && student.school_logo.startsWith("/")) {
            student.school_logo = `${mainBackendUrl}${student.school_logo}`;
        }

        // Add human readable standard and computed academic year/validity
        const validity = getAcademicValidity();
        student.standard = student.division_name
            ? `${student.class_name || ''} - ${student.division_name}`
            : (student.class_name || '');
        student.academic_year = validity.academic_year;
        student.academic_year_full = validity.academic_year_full;
        student.valid_until = validity.valid_until;
        student.valid_until_iso = validity.valid_until_iso;

        // Construct base URL from frontend env or fallback
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const qrCodeUrl = `${frontendUrl}/verify/${student.form_token}`;

        return res.json({
            success: true,
            data: student,
            qr_code_value: qrCodeUrl // Now returning a full frontend URL for easier scanning
        });

    } catch (error) {
        console.error("Error fetching student:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

/**
 * ✅ Public API: Get student details by QR code token
 * Anyone can scan QR and see approved student details
 */
exports.getStudentByQr = async (req, res) => {
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
              d.division_name, COALESCE(d.class_name, c.class_name) AS class_name,
              s.school_name, s.logo AS school_logo, s.address AS school_address, s.state AS school_state
             FROM student_forms sf
             LEFT JOIN schools s ON sf.school_id = s.id
             LEFT JOIN divisions d ON sf.division_id = d.id
             LEFT JOIN classes c ON COALESCE(d.class_id, sf.class_id) = c.id
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

        const mainBackendUrl = process.env.MAIN_BACKEND_URL || "";
        let photoUrl = student.photo || null;
        if (photoUrl && photoUrl.startsWith("/")) {
            photoUrl = `${mainBackendUrl}${photoUrl}`;
        }

        let schoolLogoUrl = student.school_logo || null;
        if (schoolLogoUrl && schoolLogoUrl.startsWith("/")) {
            schoolLogoUrl = `${mainBackendUrl}${schoolLogoUrl}`;
        }

        const validity = getAcademicValidity();
        const formattedStandard = student.division_name
            ? `${student.class_name || ''} - ${student.division_name}`
            : (student.class_name || '');

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
            standard: formattedStandard,
            division_name: student.division_name,
            academic_year: validity.academic_year,
            academic_year_full: validity.academic_year_full,
            valid_until: validity.valid_until,
            valid_until_iso: validity.valid_until_iso,
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

        // Return JSON with filtered data
        return res.json({
            success: true,
            data: publicData
        });

    } catch (error) {
        console.error("Error fetching student by QR:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
