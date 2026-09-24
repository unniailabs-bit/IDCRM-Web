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
