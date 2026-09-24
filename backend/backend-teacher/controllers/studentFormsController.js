import { QueryTypes } from "sequelize";
import sequelize from "../../config/db.js";
import crypto from "crypto";

// -------------------------------------------
//  SUBMIT STUDENT DIGITAL FORM + Auto Share Link
// -------------------------------------------
export const submitStudentForm = async (req, res) => {
  try {
    const teacherId = req.user?.id || null;

    const {
      class_id,
      roll_number,
      first_name,
      last_name,
      dob,
      gender,
      blood_group,
      photo,
      father_name,
      mother_name,

      mother_email,
      mother_phone,
      father_email,

      street_address,
      city,
      state,
      pin_code,
      emergency_contact,

      id_number,
      gr_number,
      sr_number,
      admission_number,
      registration_number,
      bus_number,

      father_occupation,
      father_office_address,
      father_photo,

      mother_occupation,
      mother_office_address,
      mother_photo,

      guardian_name,
      guardian_contact,
      guardian_occupation,
      guardian_office_address,
      guardian_photo,
      guardian_relation,
      guardian_email,   // ✅ ADDED
    } = req.body;

    // ---------- REQUIRED FIELDS ----------
    const requiredFields = {
      class_id,
      first_name,
      last_name,
      dob,
      gender,
      father_name,
      mother_name,

      mother_email,
      mother_phone,
      father_email,

      street_address,
      city,
      state,
      pin_code,
      emergency_contact,
    };

    const missing = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missing_fields: missing,
      });
    }

    // ---------- FETCH CLASS ----------
    const classQuery = await sequelize.query(
      `SELECT school_id FROM classes WHERE id = :classId`,
      {
        replacements: { classId: class_id },
        type: QueryTypes.SELECT,
      }
    );

    if (classQuery.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const school_id = classQuery[0].school_id;

    // ---------- DUPLICATE CHECK ----------
    if (roll_number !== undefined && roll_number !== null && roll_number !== "") {
      const duplicateCheck = await sequelize.query(
        `SELECT id 
         FROM student_forms 
         WHERE class_id = :classId 
           AND roll_number = :rollNumber`,
        {
          replacements: {
            classId: class_id,
            rollNumber: roll_number,
          },
          type: QueryTypes.SELECT,
        }
      );

      if (duplicateCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Form already submitted for this roll number in this class.",
        });
      }
    }

    // ---------- GENERATE TOKEN ----------
    const form_token = crypto.randomBytes(8).toString("hex");

    // ---------- INSERT ----------
    const insertQuery = `
      INSERT INTO student_forms (
        class_id, school_id, teacher_id, roll_number,
        first_name, last_name, dob, gender, blood_group, photo,
        father_name, mother_name,
        mother_email, mother_phone, father_email,
        street_address, city, state,
        pin_code, emergency_contact,
        id_number, gr_number, sr_number, admission_number, registration_number, bus_number,
        father_occupation, father_office_address, father_photo,
        mother_occupation, mother_office_address, mother_photo,
        guardian_name, guardian_contact, guardian_occupation, guardian_office_address,
        guardian_photo, guardian_relation, guardian_email,
        status, form_token
      )
      VALUES (
        :classId, :schoolId, :teacherId, :rollNumber,
        :firstName, :lastName, :dob, :gender, :bloodGroup, :photo,
        :fatherName, :motherName,
        :motherEmail, :motherPhone, :fatherEmail,
        :streetAddress, :city, :state,
        :pinCode, :emergencyContact,
        :idNumber, :grNumber, :srNumber, :admissionNumber, :registrationNumber, :busNumber,
        :fatherOccupation, :fatherOfficeAddress, :fatherPhoto,
        :motherOccupation, :motherOfficeAddress, :motherPhoto,
        :guardianName, :guardianContact, :guardianOccupation, :guardianOfficeAddress,
        :guardianPhoto, :guardianRelation, :guardianEmail,
        'submitted', :formToken
      )
      RETURNING *;
    `;

    const result = await sequelize.query(insertQuery, {
      replacements: {
        classId: class_id,
        schoolId: school_id,
        teacherId,
        rollNumber: roll_number || null,
        firstName: first_name,
        lastName: last_name,
        dob,
        gender,
        bloodGroup: blood_group || null,
        photo: photo || null,
        fatherName: father_name,
        motherName: mother_name,

        motherEmail: mother_email,
        motherPhone: mother_phone,
        fatherEmail: father_email,

        streetAddress: street_address,
        city,
        state,
        pinCode: pin_code,
        emergencyContact: emergency_contact,

        idNumber: id_number || null,
        grNumber: gr_number || null,
        srNumber: sr_number || null,
        admissionNumber: admission_number || null,
        registrationNumber: registration_number || null,
        busNumber: bus_number || null,

        fatherOccupation: father_occupation || null,
        fatherOfficeAddress: father_office_address || null,
        fatherPhoto: father_photo || null,

        motherOccupation: mother_occupation || null,
        motherOfficeAddress: mother_office_address || null,
        motherPhoto: mother_photo || null,

        guardianName: guardian_name || null,
        guardianContact: guardian_contact || null,
        guardianOccupation: guardian_occupation || null,
        guardianOfficeAddress: guardian_office_address || null,
        guardianPhoto: guardian_photo || null,
        guardianRelation: guardian_relation || null,
        guardianEmail: guardian_email || null,  // ✅ ADDED

        formToken: form_token,
      },
      type: QueryTypes.INSERT,
    });

    const publicLink = `${process.env.FRONTEND_URL}/digital-form/${form_token}`;

    return res.status(201).json({
      success: true,
      message: "Student form submitted successfully",
      data: result[0][0],
      share_link: publicLink,
    });
  } catch (error) {
    console.error("🔥 Error in submitStudentForm:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
