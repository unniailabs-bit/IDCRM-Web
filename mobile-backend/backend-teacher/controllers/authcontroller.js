const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");
const { sendOtpEmail } = require("../../config/mailer");
const parentAccountService = require("../../backend-parent/services/parentAccountService");

const {
  normalizeEmail,
  normalizePhone,
  phoneSqlExpr,
  hashPasswordIfNeeded,
  buildStudentUserPayload,
  buildTeacherPayload,
  issueParentToken,
  issueTeacherToken,
  issueSelectionToken,
  verifySelectionToken,
  findMatchingTeachers,
  fetchStudentOptionsByIds,
  mapStudentOption,
  mapTeacherOption,
  authenticateParent,
  getStudentById,
  getTeacherById,
  migratePlainStudentPassword,
  syncParentPasswordToLinkedStudents,
  parentAccountsTableExists,
  linkUnlinkedStudentsForAccount,
} = parentAccountService;

const fs = require("fs");
const path = require("path");

function completeTeacherLogin(res, teacher) {
  const token = issueTeacherToken(teacher);
  return res.json({
    success: true,
    message: "Login successful",
    requires_selection: false,
    token,
    teacher: buildTeacherPayload(teacher),
  });
}

function completeParentLogin(res, student, parentAccount) {
  const token = issueParentToken(student, parentAccount?.id || null);
  return res.json({
    success: true,
    message: "Login successful",
    requires_selection: false,
    token,
    user: buildStudentUserPayload(student),
    parent_account_id: parentAccount?.id ? Number(parentAccount.id) : null,
  });
}

async function finalizeParentStudent(res, student, password) {
  await migratePlainStudentPassword(student.id, password, student.password);
  return completeParentLogin(res, student, null);
}

exports.teacherLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
    }

    const matchedTeachers = await findMatchingTeachers(normalizedPhone, password);
    if (matchedTeachers.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    if (matchedTeachers.length > 1) {
      return res.json({
        success: true,
        requires_selection: true,
        selection_type: "teacher_school",
        message: "Select the school you want to sign in to",
        selection_token: issueSelectionToken({
          selection_type: "teacher_school",
          phone: normalizedPhone,
          teacher_ids: matchedTeachers.map((t) => Number(t.id)),
        }),
        options: matchedTeachers.map(mapTeacherOption),
      });
    }

    return completeTeacherLogin(res, matchedTeachers[0]);
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.unifiedLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
    }

    const matchedTeachers = await findMatchingTeachers(normalizedPhone, password);
    if (matchedTeachers.length > 0) {
      if (matchedTeachers.length > 1) {
        return res.json({
          success: true,
          requires_selection: true,
          selection_type: "teacher_school",
          message: "Select the school you want to sign in to",
          selection_token: issueSelectionToken({
            selection_type: "teacher_school",
            phone: normalizedPhone,
            teacher_ids: matchedTeachers.map((t) => Number(t.id)),
          }),
          options: matchedTeachers.map(mapTeacherOption),
        });
      }
      return completeTeacherLogin(res, matchedTeachers[0]);
    }

    const { parentAccount, students } = await authenticateParent(
      normalizedPhone,
      password,
    );
    if (students.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
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
    return completeParentLogin(res, students[0], parentAccount);
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.selectProfile = async (req, res) => {
  try {
    const { selection_token, selection_type, student_id, teacher_id } =
      req.body;

    if (!selection_token || !selection_type) {
      return res.status(400).json({
        success: false,
        message: "selection_token and selection_type are required",
      });
    }

    const decoded = verifySelectionToken(selection_token);
    if (decoded.selection_type !== selection_type) {
      return res.status(400).json({
        success: false,
        message: "Selection type mismatch",
      });
    }

    if (selection_type === "teacher_school") {
      const teacherId = Number(teacher_id);
      if (!teacherId || !decoded.teacher_ids?.includes(teacherId)) {
        return res.status(403).json({
          success: false,
          message: "Invalid teacher selection",
        });
      }
      const teacher = await getTeacherById(teacherId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }
      return completeTeacherLogin(res, teacher);
    }

    if (selection_type === "student") {
      const studentId = Number(student_id);
      if (!studentId || !decoded.student_ids?.includes(studentId)) {
        return res.status(403).json({
          success: false,
          message: "Invalid student selection",
        });
      }
      const student = await getStudentById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }
      return completeParentLogin(res, student, {
        id: decoded.parent_account_id || null,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Unsupported selection type",
    });
  } catch (error) {
    console.error("Select Profile Error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired selection. Please login again.",
    });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expiry = new Date(Date.now() + 10 * 60 * 1000);

    const teachers = await sequelize.query(
      `
      SELECT id, name, email, phone
      FROM teachers
      WHERE ${phoneSqlExpr("phone")} = :phone AND status = 'Active'
      `,
      { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
    );

    if (teachers.length > 0) {
      const otpEmail = teachers[0].email;
      if (!otpEmail) {
        return res.status(400).json({
          success: false,
          message: "No email on file for OTP. Please contact school admin.",
        });
      }

      await sequelize.query(
        `
        UPDATE teachers
        SET otp = :otp, otp_expiry = :otp_expiry, updated_at = NOW()
        WHERE ${phoneSqlExpr("phone")} = :phone AND status = 'Active'
        `,
        {
          replacements: { phone: normalizedPhone, otp, otp_expiry },
          type: QueryTypes.UPDATE,
        },
      );

      const emailResult = await sendOtpEmail(
        otpEmail,
        otp,
        teachers[0].name || "Teacher",
      );
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email",
          error: emailResult.error,
        });
      }

      const payload = {
        success: true,
        message: "OTP sent to your registered email",
      };
      if (teachers.length > 1) {
        const detailed = await sequelize.query(
          `
          SELECT t.id, t.name, t.email, t.subject, t.school_id, s.school_name, s.logo AS school_logo
          FROM teachers t
          LEFT JOIN schools s ON t.school_id = s.id
          WHERE ${phoneSqlExpr("t.phone")} = :phone AND t.status = 'Active'
          ORDER BY s.school_name ASC
          `,
          { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
        );
        payload.requires_selection = true;
        payload.selection_type = "teacher_reset";
        payload.options = detailed.map(mapTeacherOption);
      }
      return res.json(payload);
    }

    if (await parentAccountsTableExists()) {
      const [parentAccount] = await sequelize.query(
        `
        SELECT * FROM parent_accounts
        WHERE ${phoneSqlExpr("phone")} = :phone
        LIMIT 1
        `,
        { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
      );

      if (!parentAccount) {
        const legacyStudents = await sequelize.query(
          `
          SELECT * FROM student_forms
          WHERE ${phoneSqlExpr("father_phone")} = :phone
          LIMIT 1
          `,
          { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
        );
        if (legacyStudents.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Phone number not found in our records",
          });
        }

        const otpEmail = legacyStudents[0].father_email;
        if (!otpEmail) {
          return res.status(400).json({
            success: false,
            message: "No email on file for OTP. Please contact school admin.",
          });
        }

        await sequelize.query(
          `
          UPDATE student_forms
          SET otp = :otp, otp_expiry = :otp_expiry
          WHERE ${phoneSqlExpr("father_phone")} = :phone
          `,
          {
            replacements: { phone: normalizedPhone, otp, otp_expiry },
            type: QueryTypes.UPDATE,
          },
        );

        const emailResult = await sendOtpEmail(
          otpEmail,
          otp,
          legacyStudents[0].first_name || "Parent",
        );
        if (!emailResult.success) {
          return res.status(500).json({
            success: false,
            message: "Failed to send OTP email",
          });
        }
        return res.json({
          success: true,
          message: "OTP sent to your registered email",
        });
      }

      const otpEmail = parentAccount.email;
      if (!otpEmail) {
        return res.status(400).json({
          success: false,
          message: "No email on file for OTP. Please contact school admin.",
        });
      }

      await sequelize.query(
        `
        UPDATE parent_accounts
        SET otp = :otp, otp_expiry = :otp_expiry, updated_at = NOW()
        WHERE id = :id
        `,
        {
          replacements: { otp, otp_expiry, id: parentAccount.id },
          type: QueryTypes.UPDATE,
        },
      );

      const emailResult = await sendOtpEmail(
        otpEmail,
        otp,
        parentAccount.name || "Parent",
      );
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email",
        });
      }
      return res.json({
        success: true,
        message: "OTP sent to your registered email",
      });
    }

    const legacyStudents = await sequelize.query(
      `
      SELECT * FROM student_forms
      WHERE ${phoneSqlExpr("father_phone")} = :phone
      `,
      { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
    );
    if (legacyStudents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Phone number not found in our records",
      });
    }

    const otpEmail = legacyStudents[0].father_email;
    if (!otpEmail) {
      return res.status(400).json({
        success: false,
        message: "No email on file for OTP. Please contact school admin.",
      });
    }

    await sequelize.query(
      `
      UPDATE student_forms
      SET otp = :otp, otp_expiry = :otp_expiry
      WHERE ${phoneSqlExpr("father_phone")} = :phone
      `,
      {
        replacements: { phone: normalizedPhone, otp, otp_expiry },
        type: QueryTypes.UPDATE,
      },
    );

    const emailResult = await sendOtpEmail(
      otpEmail,
      otp,
      legacyStudents[0].first_name || "Parent",
    );
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
      });
    }
    return res.json({
      success: true,
      message: "OTP sent to your registered email",
    });
  } catch (error) {
    console.error("Request Password Reset Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.verifyOtpAndResetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword, teacher_id } = req.body;
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields (phone, otp, newPassword) are required",
      });
    }

    const hashed = await hashPasswordIfNeeded(newPassword);

    const teachers = await sequelize.query(
      `
      SELECT *
      FROM teachers
      WHERE ${phoneSqlExpr("phone")} = :phone
        AND otp = :otp
        AND otp_expiry > NOW()
        AND status = 'Active'
      ORDER BY id ASC
      `,
      { replacements: { phone: normalizedPhone, otp }, type: QueryTypes.SELECT },
    );

    if (teachers.length > 0) {
      let targetTeacher = teachers[0];
      if (teachers.length > 1) {
        const chosenId = Number(teacher_id);
        if (!chosenId) {
          return res.status(400).json({
            success: false,
            requires_selection: true,
            selection_type: "teacher_reset",
            message: "Select the school account to reset password for",
            options: teachers.map(mapTeacherOption),
          });
        }
        targetTeacher = teachers.find((t) => Number(t.id) === chosenId);
        if (!targetTeacher) {
          return res.status(403).json({
            success: false,
            message: "Invalid teacher selection",
          });
        }
      }

      await sequelize.query(
        `
        UPDATE teachers
        SET password = :hashed, otp = NULL, otp_expiry = NULL, updated_at = NOW()
        WHERE id = :id
        `,
        {
          replacements: { hashed, id: targetTeacher.id },
          type: QueryTypes.UPDATE,
        },
      );

      return res.json({
        success: true,
        message: "Password reset successful",
      });
    }

    if (await parentAccountsTableExists()) {
      const [parentAccount] = await sequelize.query(
        `
        SELECT *
        FROM parent_accounts
        WHERE ${phoneSqlExpr("phone")} = :phone
          AND otp = :otp
          AND otp_expiry > NOW()
        LIMIT 1
        `,
        { replacements: { phone: normalizedPhone, otp }, type: QueryTypes.SELECT },
      );

      if (parentAccount) {
        await sequelize.query(
          `
          UPDATE parent_accounts
          SET password = :hashed, otp = NULL, otp_expiry = NULL, updated_at = NOW()
          WHERE id = :id
          `,
          {
            replacements: { hashed, id: parentAccount.id },
            type: QueryTypes.UPDATE,
          },
        );
        parentAccount.password = hashed;
        await linkUnlinkedStudentsForAccount(parentAccount);
        await syncParentPasswordToLinkedStudents(parentAccount.id, hashed);
        return res.json({
          success: true,
          message: "Password reset successful",
        });
      }
    }

    const [legacyParent] = await sequelize.query(
      `
      SELECT *
      FROM student_forms
      WHERE ${phoneSqlExpr("father_phone")} = :phone
        AND otp = :otp
        AND otp_expiry > NOW()
      LIMIT 1
      `,
      { replacements: { phone: normalizedPhone, otp }, type: QueryTypes.SELECT },
    );

    if (!legacyParent) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    await sequelize.query(
      `
      UPDATE student_forms
      SET password = :hashed, otp = NULL, otp_expiry = NULL
      WHERE ${phoneSqlExpr("father_phone")} = :phone
      `,
      {
        replacements: { hashed, phone: normalizedPhone },
        type: QueryTypes.UPDATE,
      },
    );

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const { name, password } = req.body;
    let profile_pic = req.file ? req.file.path.replace(/\\/g, "/") : undefined;

    const [oldTeacher] = await sequelize.query(
      `SELECT profile_pic FROM teachers WHERE id = :id`,
      {
        replacements: { id: teacherId },
        type: QueryTypes.SELECT,
      },
    );

    const updates = [];
    const replacements = { id: teacherId };

    if (name) {
      updates.push("name = :name");
      replacements.name = name;
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push("password = :password");
      replacements.password = hashed;
    }

    if (profile_pic) {
      updates.push("profile_pic = :profile_pic");
      replacements.profile_pic = profile_pic;

      if (oldTeacher && oldTeacher.profile_pic) {
        const oldFilePath = path.join(__dirname, "../../", oldTeacher.profile_pic);
        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error("Error deleting old profile pic:", err);
          });
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    await sequelize.query(
      `UPDATE teachers SET ${updates.join(", ")}, updated_at = NOW() WHERE id = :id`,
      {
        replacements,
        type: QueryTypes.UPDATE,
      },
    );

    const [updatedTeacher] = await sequelize.query(
      `SELECT id, name, email, phone, subject, profile_pic FROM teachers WHERE id = :id`,
      {
        replacements: { id: teacherId },
        type: QueryTypes.SELECT,
      },
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      teacher: {
        ...updatedTeacher,
        profile_pic: parentAccountService.formatMediaUrl(updatedTeacher.profile_pic),
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
