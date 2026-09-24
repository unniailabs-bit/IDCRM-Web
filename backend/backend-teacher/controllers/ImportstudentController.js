const XLSX = require("xlsx");
const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const crypto = require("crypto");
const fs = require("fs");
const { linkStudentToParentAccount } = require("../../utils/parentAccountLinker");

// Normalize keys (trim + lowercase)
function normalizeRow(row) {
  const normalized = {};
  Object.keys(row).forEach((key) => {
    normalized[key.trim().toLowerCase()] = row[key];
  });
  return normalized;
}

// Get value by possible keys (case-insensitive, flexible matching)
function getValue(row, keys) {
  for (let key of keys) {
    key = key.toLowerCase();
    // Try exact match
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return typeof row[key] === "string" ? row[key].trim() : row[key];
    }
    // Try partial match
    for (let rowKey in row) {
      if (
        rowKey.includes(key) ||
        key.includes(rowKey) ||
        rowKey.replace(/\s+/g, "") === key.replace(/\s+/g, "") ||
        rowKey.replace(/_/g, " ") === key.replace(/_/g, " ")
      ) {
        if (
          row[rowKey] !== undefined &&
          row[rowKey] !== null &&
          row[rowKey] !== ""
        ) {
          return typeof row[rowKey] === "string" ? row[rowKey].trim() : row[rowKey];
        }
      }
    }
  }
  return null;
}

// Validate date format (supports flexible formats: DD-MM-YYYY, YYYY-MM-DD, D/M/YYYY etc.)
function validateDate(dateString) {
  if (dateString === undefined || dateString === null) return null;

  // Handle Date objects directly
  if (dateString instanceof Date) {
    if (!isNaN(dateString.getTime())) {
      return dateString.toISOString().split("T")[0];
    }
    return null;
  }

  const dateStr = dateString.toString().trim();
  if (dateStr === "" || dateStr === "-") return null;

  // Attempt to parse as a number (Excel serial date)
  if (!isNaN(dateStr) && !isNaN(parseFloat(dateStr))) {
    const num = parseFloat(dateStr);
    if (num > 0) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + num * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0]; // YYYY-MM-DD
      }
    }
  }

  // Attempt to parse as YYYY-MM-DD (standard database format)
  const ymdRegex = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/;
  let ymdMatch = dateStr.match(ymdRegex);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // Attempt to parse as DD-MM-YYYY or MM-DD-YYYY (supports single/double digits and delimiters: . / -)
  const generalRegex = /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/;
  let match = dateStr.match(generalRegex);
  if (match) {
    const g1 = parseInt(match[1], 10);
    const g2 = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Try parsing as DD-MM-YYYY first (Indian format preference)
    const dateDmy = new Date(year, g2 - 1, g1);
    if (
      dateDmy.getFullYear() === year &&
      dateDmy.getMonth() === g2 - 1 &&
      dateDmy.getDate() === g1 &&
      g2 >= 1 && g2 <= 12
    ) {
      return `${year}-${String(g2).padStart(2, "0")}-${String(g1).padStart(2, "0")}`;
    }

    // Fallback to MM-DD-YYYY if DD-MM-YYYY was invalid (e.g. Month > 12)
    const dateMdy = new Date(year, g1 - 1, g2);
    if (
      dateMdy.getFullYear() === year &&
      dateMdy.getMonth() === g1 - 1 &&
      dateMdy.getDate() === g2 &&
      g1 >= 1 && g1 <= 12
    ) {
      return `${year}-${String(g1).padStart(2, "0")}-${String(g2).padStart(2, "0")}`;
    }
  }

  // Fallback to general Javascript Date parsing as a last resort
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth() + 1;
    const day = parsedDate.getDate();
    if (year > 1900 && year < 2100) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return null;
}

// Validate email format
function validateEmail(email) {
  if (!email) return null;
  const emailStr = email.toString().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailStr) ? emailStr : null;
}

// Validate phone (10 digits)
function validatePhone(phone) {
  if (!phone) return null;
  const phoneStr = phone.toString().replace(/\D/g, ""); // Remove non-digits
  return phoneStr.length >= 10 ? phoneStr : null;
}

// Validate gender (fully case-insensitive mapping for F/Female/female and M/Male/male)
function validateGender(gender) {
  if (!gender) return null;
  const normalized = gender.toString().toLowerCase().trim();

  // Common mappings for normalization
  if (["male", "m", "purush", "purus"].includes(normalized)) return "Male";
  if (["female", "f", "mahila", "stri"].includes(normalized)) return "Female";
  if (["other", "o"].includes(normalized)) return "Other";

  // Fallback: capitalized first letter
  return gender.toString().trim().charAt(0).toUpperCase() + gender.toString().trim().slice(1);
}

// Validate blood group (returns null for "-" or empty string)
function validateBloodGroup(bloodGroup) {
  if (!bloodGroup) return null;
  const str = bloodGroup.toString().trim();
  if (str === "" || str === "-") return null;
  const validGroups = ["a+", "a-", "b+", "b-", "ab+", "ab-", "o+", "o-"];
  const normalized = str.toUpperCase();
  return validGroups.includes(normalized.toLowerCase()) ? normalized : null;
}

exports.importStudentsExcel = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file required",
      });
    }

    // Read Excel from memory buffer
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rawData || rawData.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Excel file is empty or has no data rows",
      });
    }

    // Get school_id and teacher_id from JWT (for security)
    const { school_id, id: teacher_id } = req.user;

    // Get class_id and division_id from request body (teacher chooses)
    const { class_id, division_id } = req.body;

    if (!school_id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "school_id must come from JWT. Missing in token.",
      });
    }

    if (!class_id || !division_id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "class_id and division_id are required in request body.",
      });
    }

    // Map and validate students data
    const studentsToInsert = [];
    const errors = [];

    rawData.forEach((row, index) => {
      const normalizedRow = normalizeRow(row);
      const rowNumber = index + 2; // +2 because index is 0-based and header is row 1
      const rowErrors = [];

      // Map CSV columns to database fields with flexible matching
      const grNumber = getValue(normalizedRow, [
        "gr number", "gr no", "gr_number", "grnumber", "g.r. no"
      ]);
      const rollNumber = getValue(normalizedRow, [
        "roll number", "roll no", "rollno", "roll_number"
      ]);
      const firstName = getValue(normalizedRow, [
        "first name", "firstname", "first_name"
      ]);
      const middleName = getValue(normalizedRow, [
        "middle name", "middlename", "middle_name"
      ]);
      const lastName = getValue(normalizedRow, [
        "last name", "lastname", "last_name", "surname"
      ]);
      const dob = validateDate(
        getValue(normalizedRow, [
          "date of birth", "dob", "birth date", "birthdate"
        ]),
      );
      const gender = validateGender(getValue(normalizedRow, ["gender", "sex"]));

      // Blood Group is optional (can also be "-" or blank)
      const rawBloodGroup = getValue(normalizedRow, [
        "blood group", "bloodgroup", "blood_group", "blood"
      ]);
      let bloodGroup = null;
      if (rawBloodGroup !== undefined && rawBloodGroup !== null) {
        const bgStr = rawBloodGroup.toString().trim();
        if (bgStr !== "" && bgStr !== "-") {
          bloodGroup = validateBloodGroup(bgStr);
          if (!bloodGroup) {
            rowErrors.push("Blood Group (must be A+/A-/B+/B-/AB+/AB-/O+/O- or -)");
          }
        }
      }

      const fatherName = getValue(normalizedRow, [
        "father name", "fathername", "father_name", "father"
      ]);
      const fatherEmail = validateEmail(
        getValue(normalizedRow, [
          "father email", "fatheremail", "father_email", "father's email", "fathers email"
        ]),
      );
      const fatherPhone = validatePhone(
        getValue(normalizedRow, [
          "father phone", "fatherphone", "father_phone"
        ]),
      );
      const motherName = getValue(normalizedRow, [
        "mother name", "mothername", "mother_name", "mother"
      ]);
      const motherPhone = validatePhone(
        getValue(normalizedRow, [
          "mother phone", "motherphone", "mother_phone"
        ]),
      );
      const streetAddress = getValue(normalizedRow, [
        "street address", "streetaddress", "street_address", "address"
      ]);
      const city = getValue(normalizedRow, ["city"]);
      const state = getValue(normalizedRow, ["state"]);
      const pinCode = getValue(normalizedRow, [
        "pin code", "pincode", "pin_code", "postal code"
      ]);
      const emergencyContact = validatePhone(
        getValue(normalizedRow, [
          "emergency contact",
          "emergencycontact",
          "emergency_contact",
        ]),
      );

      // Guardian fields are optional (can also be "-" or blank)
      const rawGuardianName = getValue(normalizedRow, [
        "guardian name",
        "guardianname",
        "guardian_name",
        "guardian",
      ]);
      const guardianName = (rawGuardianName && rawGuardianName.toString().trim() !== "" && rawGuardianName.toString().trim() !== "-")
        ? rawGuardianName.toString().trim()
        : null;

      const rawGuardianPhone = getValue(normalizedRow, [
        "guardian phone",
        "guardian contact",
        "guardianphone",
        "guardiancontact",
        "guardian_phone",
        "guardian_contact",
      ]);
      let guardianPhone = null;
      if (rawGuardianPhone !== undefined && rawGuardianPhone !== null) {
        const gpStr = rawGuardianPhone.toString().trim();
        if (gpStr !== "" && gpStr !== "-") {
          guardianPhone = validatePhone(gpStr);
          if (!guardianPhone) {
            rowErrors.push("Guardian Phone must be a valid 10-digit number");
          }
        }
      }

      const rawGuardianEmail = getValue(normalizedRow, [
        "guardian email",
        "guardianemail",
        "guardian_email",
      ]);
      let guardianEmail = null;
      if (rawGuardianEmail !== undefined && rawGuardianEmail !== null) {
        const geStr = rawGuardianEmail.toString().trim();
        if (geStr !== "" && geStr !== "-") {
          guardianEmail = validateEmail(geStr);
          if (!guardianEmail) {
            rowErrors.push("Guardian Email must be a valid email address");
          }
        }
      }

      // Validate required fields
      if (!rollNumber) rowErrors.push("Roll Number");
      if (!firstName) rowErrors.push("First Name");
      // if (!middleName) rowErrors.push("Middle Name");
      if (!lastName) rowErrors.push("Last Name");
      if (!dob)
        rowErrors.push(
          "Date of Birth (format: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD)",
        );
      if (!gender) rowErrors.push("Gender (Male/Female/Other)");
      if (!fatherName) rowErrors.push("Father Name");
      if (!fatherEmail) rowErrors.push("Father Email");
      if (!motherName) rowErrors.push("Mother Name");
      if (!streetAddress) rowErrors.push("Street Address");
      if (!city) rowErrors.push("City");
      if (!state) rowErrors.push("State");
      if (!pinCode) rowErrors.push("PIN Code");
      if (!emergencyContact) rowErrors.push("Emergency Contact");

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          errors: rowErrors,
        });
        return; // Skip this row
      }

      // Generate unique form_token
      const form_token = crypto.randomBytes(8).toString("hex");

      studentsToInsert.push({
        gr_number: grNumber ? grNumber.toString().trim() : null,
        roll_number: rollNumber.toString().trim(),
        first_name: firstName.toString().trim(),
        middle_name: middleName ? middleName.toString().trim() : null,
        last_name: lastName.toString().trim(),
        dob: dob,
        gender: gender,
        blood_group: bloodGroup,
        father_name: fatherName.toString().trim(),
        father_email: fatherEmail.toString().trim(),
        father_phone: fatherPhone,
        mother_name: motherName.toString().trim(),
        mother_phone: motherPhone,
        street_address: streetAddress.toString().trim(),
        city: city.toString().trim(),
        state: state.toString().trim(),
        pin_code: pinCode.toString().trim(),
        emergency_contact: emergencyContact,
        guardian_name: guardianName ? guardianName.toString().trim() : null,
        guardian_contact: guardianPhone,
        guardian_email: guardianEmail ? guardianEmail.toString().trim() : null,
        school_id,
        class_id,
        division_id,
        teacher_id,
        form_token,
      });
    });

    // Return errors if any rows failed validation
    if (errors.length > 0 && studentsToInsert.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "All rows failed validation",
        errors: errors,
      });
    }

    if (studentsToInsert.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No valid students to import",
        errors: errors,
      });
    }

    // Check for duplicate roll numbers or GR numbers
    const rollNumbers = studentsToInsert.map((s) => s.roll_number);
    const grNumbers = studentsToInsert
      .map((s) => s.gr_number)
      .filter((gr) => gr !== null);

    const existingForms = await sequelize.query(
      `SELECT roll_number, gr_number FROM student_forms 
       WHERE school_id = :school_id 
       AND (
         (class_id = :class_id AND division_id = :division_id AND roll_number IN (:rollNumbers))
         OR 
         (gr_number IN (:grNumbers))
       )`,
      {
        replacements: {
          school_id,
          class_id,
          division_id,
          rollNumbers,
          grNumbers: grNumbers.length > 0 ? grNumbers : [null],
        },
        type: QueryTypes.SELECT,
        transaction: t,
      },
    );

    const existingRolls = existingForms.map((f) => f.roll_number?.toString());
    const existingGRs = existingForms
      .map((f) => f.gr_number?.toString())
      .filter((gr) => gr !== undefined && gr !== null);

    const duplicateRolls = studentsToInsert
      .filter((s) => existingRolls.includes(s.roll_number.toString()))
      .map((s) => s.roll_number);

    const duplicateGRs = studentsToInsert
      .filter(
        (s) => s.gr_number && existingGRs.includes(s.gr_number.toString()),
      )
      .map((s) => s.gr_number);

    // Filter out duplicates (both roll number and GR number)
    const newStudents = studentsToInsert.filter((s) => {
      const isDuplicateRoll = existingRolls.includes(s.roll_number.toString());
      const isDuplicateGR =
        s.gr_number && existingGRs.includes(s.gr_number.toString());
      return !isDuplicateRoll && !isDuplicateGR;
    });

    if (newStudents.length === 0) {
      await t.rollback();
      if (errors.length > 0) {
        console.log("Validation Errors during import:", JSON.stringify(errors, null, 2));
      }
      return res.status(200).json({
        success: true,
        message:
          "No new students to import. All roll numbers or GR numbers already exist in this school.",
        count: 0,
        students: [],
        duplicateRolls: duplicateRolls,
        duplicateGRs: duplicateGRs,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Insert students into student_forms table
    const insertedForms = [];
    for (const student of newStudents) {
      try {
        const [result] = await sequelize.query(
          `INSERT INTO student_forms (
            class_id, division_id, school_id, teacher_id, roll_number, gr_number,
            first_name, middle_name, last_name, dob, gender, blood_group,
            father_name, father_email, father_phone, mother_name, mother_phone,
            street_address, city, state, pin_code, emergency_contact,
            guardian_name, guardian_contact, guardian_email,
            status, form_token, created_at, updated_at
          ) VALUES (
            :class_id, :division_id, :school_id, :teacher_id, :roll_number, :gr_number,
            :first_name, :middle_name, :last_name, :dob, :gender, :blood_group,
            :father_name, :father_email, :father_phone, :mother_name, :mother_phone,
            :street_address, :city, :state, :pin_code, :emergency_contact,
            :guardian_name, :guardian_contact, :guardian_email,
            'submitted', :form_token, NOW(), NOW()
          ) RETURNING *`,
          {
            replacements: student,
            type: QueryTypes.INSERT,
            transaction: t,
          },
        );

        const row = Array.isArray(result) ? result[0] : result;
        if (row && row.id) {
          row.form_id = row.id;
          try {
            await linkStudentToParentAccount(row, t);
          } catch (linkErr) {
            console.warn("Parent account link skipped on import", linkErr.message);
          }
        }
        insertedForms.push(row);
      } catch (insertError) {
        console.error(
          `Error inserting student ${student.roll_number}:`,
          insertError,
        );
        errors.push({
          row: student.roll_number,
          errors: [`Failed to insert: ${insertError.message}`],
        });
      }
    }

    await t.commit();



    return res.status(200).json({
      success: true,
      message: `Students imported successfully! ${insertedForms.length} students imported.`,
      count: insertedForms.length,
      students: insertedForms,
      errors: errors.length > 0 ? errors : undefined,
      duplicateRolls: duplicateRolls.length > 0 ? duplicateRolls : undefined,
      duplicateGRs: duplicateGRs.length > 0 ? duplicateGRs : undefined,
    });
  } catch (error) {
    await t.rollback();



    console.error("Import error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
