const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const parentAccountService = require("../services/parentAccountService");

const {
  authenticateParent,
  issueParentToken,
  issueSelectionToken,
  buildStudentUserPayload,
  fetchStudentOptionsByIds,
  mapStudentOption,
  migratePlainStudentPassword,
  getLinkedStudentsForAccount,
  getStudentById,
  studentLinkedToParent,
  normalizePhone,
  hashPasswordIfNeeded,
  syncParentPasswordToLinkedStudents,
  parentAccountsTableExists,
  refreshParentToken,
} = parentAccountService;

// Legacy export kept for any external requires
async function resolveParentStudent(fatherPhone, password) {
  const { students } = await authenticateParent(fatherPhone, password);
  return students.length === 1 ? students[0] : students[0] || null;
}

exports.resolveParentStudent = resolveParentStudent;
exports.migratePlainPassword = migratePlainStudentPassword;

// -----------------------------
// Parent Login
// -----------------------------
exports.parentLogin = async (req, res) => {
  try {
    const phone = req.body.father_phone || req.body.phone;
    const password = req.body.password;
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number and password are required" });
    }

    const { parentAccount, students } = await authenticateParent(
      normalizedPhone,
      password,
    );

    if (students.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Parent not found or invalid password",
      });
    }

    if (students.length > 1) {
      const optionRows = await fetchStudentOptionsByIds(
        students.map((s) => s.id),
      );
      return res.json({
        success: true,
        requires_selection: true,
        selection_type: "student",
        message: "Select the student profile to continue",
        parent_account_id: parentAccount?.id ? Number(parentAccount.id) : null,
        selection_token: issueSelectionToken({
          selection_type: "student",
          phone: normalizedPhone,
          parent_account_id: parentAccount?.id ? Number(parentAccount.id) : null,
          student_ids: students.map((s) => Number(s.id)),
        }),
        options: optionRows.map(mapStudentOption),
      });
    }

    await migratePlainStudentPassword(
      students[0].id,
      password,
      students[0].password,
    );

    const token = issueParentToken(students[0], parentAccount?.id || null);

    return res.json({
      success: true,
      message: "Login successful",
      requires_selection: false,
      token,
      parent: buildStudentUserPayload(students[0]),
      parent_account_id: parentAccount?.id ? Number(parentAccount.id) : null,
    });
  } catch (error) {
    console.error("Parent Login Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// Refresh Token
// Accepts an expired token and re-issues a fresh JWT (90d).
// The mobile app should call this when it receives a 401 from any endpoint.
// -----------------------------
exports.refreshToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.body.token;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }
    const newToken = await refreshParentToken(token);
    if (!newToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid token — please login again",
      });
    }
    return res.json({ success: true, token: newToken });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// Update Parent Profile
// -----------------------------
exports.updateParentProfile = async (req, res) => {
  try {
    const parentId = req.parent.id;
    const parentAccountId = req.parentAccountId || null;
    const { first_name, last_name, father_email, password } = req.body;

    const updates = [];
    const replacements = { id: parentId };

    if (first_name) {
      updates.push("first_name = :first_name");
      replacements.first_name = first_name;
    }
    if (last_name) {
      updates.push("last_name = :last_name");
      replacements.last_name = last_name;
    }
    if (father_email) {
      updates.push("father_email = :father_email");
      replacements.father_email = father_email;
    }
    if (password) {
      const hashed = await hashPasswordIfNeeded(password);
      updates.push("password = :password");
      replacements.password = hashed;

      if (parentAccountId && (await parentAccountsTableExists())) {
        await sequelize.query(
          `UPDATE parent_accounts SET password = :password, updated_at = NOW() WHERE id = :id`,
          {
            replacements: { password: hashed, id: parentAccountId },
            type: QueryTypes.UPDATE,
          },
        );
        await syncParentPasswordToLinkedStudents(parentAccountId, hashed);
      }
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    const query = `UPDATE student_forms SET ${updates.join(", ")} WHERE id = :id`;

    await sequelize.query(query, {
      replacements,
      type: QueryTypes.UPDATE,
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update Parent Profile Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getLinkedStudents = async (req, res) => {
  try {
    const parentAccountId = req.parentAccountId;
    if (!parentAccountId) {
      return res.json({
        success: true,
        options: [],
      });
    }

    const options = await getLinkedStudentsForAccount(parentAccountId);
    return res.json({
      success: true,
      options,
      active_student_id: Number(req.parent.id),
    });
  } catch (error) {
    console.error("Get Linked Students Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.switchStudent = async (req, res) => {
  try {
    const parentAccountId = req.parentAccountId;
    const { student_id } = req.body;
    const studentId = Number(student_id);

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "student_id is required",
      });
    }

    if (parentAccountId) {
      const linked = await studentLinkedToParent(parentAccountId, studentId);
      if (!linked) {
        return res.status(403).json({
          success: false,
          message: "Student is not linked to this parent account",
        });
      }
    } else if (Number(req.parent.id) !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Student switch is not available for this session",
      });
    }

    const student = await getStudentById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const token = issueParentToken(student, parentAccountId);
    return res.json({
      success: true,
      message: "Student profile switched",
      token,
      user: buildStudentUserPayload(student),
      parent_account_id: parentAccountId ? Number(parentAccountId) : null,
    });
  } catch (error) {
    console.error("Switch Student Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// Parent Dashboard (with School Info)
// -----------------------------
exports.getParentDashboard = async (req, res) => {
  try {
    const parentId = req.parent.id;

    // Fetch detailed parent/student info with class and division names
    const parentData = await sequelize.query(
      `SELECT 
        sf.*, 
        COALESCE(d.class_name, c.class_name) AS class_name, 
        d.division_name
       FROM student_forms sf
       LEFT JOIN divisions d ON sf.division_id = d.id
       LEFT JOIN classes c ON COALESCE(d.class_id, sf.class_id) = c.id
       WHERE sf.id = :parentId`,
      { replacements: { parentId }, type: QueryTypes.SELECT },
    );

    if (parentData.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Parent/Student record not found" });
    }

    const data = parentData[0];
    const schoolId = data.school_id;

    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;

    // Fetch school info (excluding sensitive fields: password, otp, otp_expires)
    const schools = await sequelize.query(
      `SELECT id, trust_id, school_name, school_admin_name, email, phone, address,
              school_code, custom_id, section, city, state, pincode, logo, principal_sign
       FROM schools WHERE id = :schoolId`,
      { replacements: { schoolId }, type: QueryTypes.SELECT },
    );

    const schoolInfo = schools.length > 0 ? schools[0] : null;

    const mainBackendUrl =
      process.env.MAIN_BACKEND_URL ||
      "https://idcrm-backend-909168107470.asia-south1.run.app";
    if (schoolInfo) {
      if (schoolInfo.logo && schoolInfo.logo.startsWith("/")) {
        schoolInfo.logo = `${mainBackendUrl}${schoolInfo.logo}`;
      }
      if (
        schoolInfo.principal_sign &&
        schoolInfo.principal_sign.startsWith("/")
      ) {
        schoolInfo.principal_sign = `${mainBackendUrl}${schoolInfo.principal_sign}`;
      }
    }

    let profilePic = data.photo || null;
    if (profilePic && profilePic.startsWith("/")) {
      profilePic = `${mainBackendUrl}${profilePic}`;
    }

    return res.json({
      success: true,
      message: `Welcome ${data.first_name} ${data.last_name}`,
      personalInformation: {
        student: {
          first_name: data.first_name,
          last_name: data.last_name,
          roll_number: data.roll_number,
          class_name: data.class_name,
          division_name: data.division_name,
          profile_pic: profilePic,
        },
        father: {
          name: data.father_name,
          email: data.father_email,
          phone: data.father_phone,
        },
        address: {
          street: data.street_address,
          city: data.city,
          state: data.state,
          pin_code: data.pin_code,
          full_address: `${data.street_address}, ${data.city}, ${data.state} - ${data.pin_code}`,
        },
      },
      school: schoolInfo,
    });
  } catch (error) {
    console.error("Get Parent Dashboard Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// Debug Login — diagnose why a phone number fails to login
// GET /api/parent/debug-login?phone=9876543210
// Returns NO passwords, only diagnostic info
// -----------------------------
exports.debugLogin = async (req, res) => {
  try {
    const phone = req.query.phone;
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: "phone query param required (10 digits)" });
    }

    const { QueryTypes } = require("sequelize");
    const { phoneSqlExpr, parentAccountsTableExists } = require("../services/parentAccountService");

    // 1. Check parent_accounts
    let parentAccount = null;
    if (await parentAccountsTableExists()) {
      const [pa] = await sequelize.query(
        `SELECT id, phone, email, name, 
                CASE WHEN password IS NULL THEN 'NULL'
                     WHEN password LIKE '$2%' THEN 'bcrypt'
                     ELSE 'plaintext' END AS password_type,
                created_at, updated_at
         FROM parent_accounts
         WHERE ${phoneSqlExpr("phone")} = :phone LIMIT 1`,
        { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
      );
      parentAccount = pa || null;
    }

    // 2. Check student_forms by father_phone
    const studentsByFather = await sequelize.query(
      `SELECT id, first_name, last_name, father_phone, class_id, division_id, school_id,
              CASE WHEN password IS NULL THEN 'NULL'
                   WHEN password LIKE '$2%' THEN 'bcrypt'
                   ELSE 'plaintext' END AS password_type
       FROM student_forms
       WHERE ${phoneSqlExpr("father_phone")} = :phone
       ORDER BY id ASC`,
      { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
    );

    // 3. Check student_forms by mother_phone
    const studentsByMother = await sequelize.query(
      `SELECT id, first_name, last_name, mother_phone, class_id, division_id, school_id,
              CASE WHEN password IS NULL THEN 'NULL'
                   WHEN password LIKE '$2%' THEN 'bcrypt'
                   ELSE 'plaintext' END AS password_type
       FROM student_forms
       WHERE ${phoneSqlExpr("mother_phone")} = :phone
       ORDER BY id ASC`,
      { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
    );

    // 4. Check parent_student_links
    let linkedStudents = [];
    if (parentAccount) {
      linkedStudents = await sequelize.query(
        `SELECT psl.student_form_id, sf.first_name, sf.last_name, sf.father_phone,
                CASE WHEN sf.password IS NULL THEN 'NULL'
                     WHEN sf.password LIKE '$2%' THEN 'bcrypt'
                     ELSE 'plaintext' END AS password_type
         FROM parent_student_links psl
         JOIN student_forms sf ON sf.id = psl.student_form_id
         WHERE psl.parent_account_id = :parentAccountId
         ORDER BY sf.id ASC`,
        { replacements: { parentAccountId: parentAccount.id }, type: QueryTypes.SELECT },
      );
    }

    return res.json({
      success: true,
      normalized_phone: normalizedPhone,
      parent_account: parentAccount,
      students_by_father_phone: studentsByFather,
      students_by_mother_phone: studentsByMother,
      linked_students: linkedStudents,
      diagnosis: !parentAccount
        ? "No parent_accounts record. Will use legacy student_forms lookup."
        : linkedStudents.length === 0
          ? "Parent account exists but NO students linked. linkUnlinkedStudentsForAccount should fix this on login."
          : `Parent account exists with ${linkedStudents.length} linked student(s). If login fails, parent_accounts.password hash may be stale.`,
    });
  } catch (error) {
    console.error("Debug Login Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// Admin Reset Password
// POST /api/parent/admin-reset-password
// Body: { phone, new_password, admin_key }
// Resets parent_accounts + all linked student_forms passwords
// -----------------------------
exports.adminResetPassword = async (req, res) => {
  try {
    const { phone, new_password, admin_key } = req.body;

    // Simple admin key protection — set ADMIN_SECRET in your .env
    const adminSecret = process.env.ADMIN_SECRET || "shikshalay_admin_2026";
    if (admin_key !== adminSecret) {
      return res.status(403).json({ success: false, message: "Invalid admin key" });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !new_password) {
      return res.status(400).json({
        success: false,
        message: "phone and new_password are required",
      });
    }

    const { phoneSqlExpr, parentAccountsTableExists } = require("../services/parentAccountService");
    const hashed = await hashPasswordIfNeeded(new_password);
    const results = { parent_account_updated: false, students_updated: 0 };

    // 1. Update parent_accounts
    if (await parentAccountsTableExists()) {
      const [parentAccount] = await sequelize.query(
        `SELECT id FROM parent_accounts WHERE ${phoneSqlExpr("phone")} = :phone LIMIT 1`,
        { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
      );

      if (parentAccount) {
        await sequelize.query(
          `UPDATE parent_accounts SET password = :password, updated_at = NOW() WHERE id = :id`,
          { replacements: { password: hashed, id: parentAccount.id }, type: QueryTypes.UPDATE },
        );
        results.parent_account_updated = true;
        results.parent_account_id = parentAccount.id;

        // 2. Update ALL linked student_forms passwords
        await sequelize.query(
          `UPDATE student_forms sf
           SET password = :password
           FROM parent_student_links psl
           WHERE psl.student_form_id = sf.id
             AND psl.parent_account_id = :parentAccountId`,
          { replacements: { password: hashed, parentAccountId: parentAccount.id }, type: QueryTypes.UPDATE },
        );
      }
    }

    // 3. Also update student_forms found by phone directly (in case not linked yet)
    await sequelize.query(
      `UPDATE student_forms
       SET password = :password
       WHERE ${phoneSqlExpr("father_phone")} = :phone
          OR ${phoneSqlExpr("mother_phone")} = :phone`,
      { replacements: { password: hashed, phone: normalizedPhone }, type: QueryTypes.UPDATE },
    );

    console.log(`[AdminReset] Password reset for phone ${normalizedPhone}:`, results);

    return res.json({
      success: true,
      message: "Password reset successful for phone " + normalizedPhone,
      results,
    });
  } catch (error) {
    console.error("Admin Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
