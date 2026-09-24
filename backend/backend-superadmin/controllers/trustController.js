const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcryptjs');

// ---------------- Create Trust ----------------
const createTrust = async (req, res) => {
  try {
    const {
      trustName,
      email,
      phone,
      address,
      password,
      city,
      state,
      pincode,
      fullName,
      designation,
      adminEmail,
      adminPhone,
      allot_ids
    } = req.body;

    // ---- Validation ----
    if (!trustName || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Trust name, email, and password are required'
      });
    }

    // ---- Check if Email Exists ----
    const existingEmailCheck = await sequelize.query(
      `SELECT id FROM trusts WHERE email = :email LIMIT 1`,
      { replacements: { email }, type: QueryTypes.SELECT }
    );

    if (existingEmailCheck && existingEmailCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A trust with this email already exists'
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert query
    const query = `
      INSERT INTO trusts 
      (trust_name, email, phone, address, password, city, state, pincode, full_name, designation, 
       admin_email, admin_phone, allot_ids, credit, registration_status, custom_id, created_at, updated_at)
      VALUES (
        :trust_name, :email, :phone, :address, :password, :city, :state, :pincode, :full_name, 
        :designation, :admin_email, :admin_phone, :allot_ids, :credit, 'Active',
        (SELECT 'ash-tr-' || LPAD(nextval('trust_custom_seq')::text, 3, '0')),
        NOW(), NOW()
      )
      RETURNING *;
    `;

    const replacements = {
      trust_name: trustName,
      email: email || null,
      phone: phone || null,
      address: address || null,
      password: hashedPassword,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      full_name: fullName || null,
      designation: designation || null,
      admin_email: adminEmail || null,
      admin_phone: adminPhone || null,
      allot_ids: allot_ids || 0,
      credit: allot_ids || 0
    };

    const [result] = await sequelize.query(query, {
      replacements,
      type: QueryTypes.INSERT
    });

    const insertedTrust = Array.isArray(result) ? result[0] : result;
    if (insertedTrust) delete insertedTrust.password;

    res.status(201).json({
      success: true,
      message: '✅ Trust created successfully',
      data: insertedTrust
    });

  } catch (err) {
    console.error('Create Trust Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
const getAllTrusts = async (req, res) => {
  try {
    // 1️⃣ Get all trusts
    const trustsQuery = `
      SELECT 
        id, custom_id, trust_name, email, phone, address,
        city, state, pincode, full_name, designation, admin_email, 
        admin_phone, allot_ids, registration_status, created_at, updated_at
      FROM trusts
      ORDER BY id DESC;
    `;
    const trusts = await sequelize.query(trustsQuery, { type: QueryTypes.SELECT });

    if (trusts.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 2️⃣ Get all schools linked to trusts
    const trustIds = trusts.map(t => t.id);
    const schoolsQuery = `
      SELECT 
        id, trust_id
      FROM schools
      WHERE trust_id IN (:trustIds);
    `;
    const schools = await sequelize.query(schoolsQuery, {
      replacements: { trustIds },
      type: QueryTypes.SELECT
    });

    // 3️⃣ Map school count to respective trusts
    const trustsWithSchoolCount = trusts.map(trust => {
      const relatedSchools = schools.filter(s => s.trust_id === trust.id);
      return {
        ...trust,
        school_count: relatedSchools.length
      };
    });

    res.status(200).json({
      success: true,
      data: trustsWithSchoolCount
    });

  } catch (err) {
    console.error('Get All Trusts Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Update Trust (PATCH) ----------------
const updateTrust = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      trustName,
      email,
      phone,
      address,
      password,
      city,
      state,
      pincode,
      fullName,
      designation,
      adminEmail,
      adminPhone,
      allot_ids,
      registrationStatus
    } = req.body;

    // ---- Check if Trust Exists ----
    const existingTrust = await sequelize.query(
      `SELECT * FROM trusts WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!existingTrust || existingTrust.length === 0) {
      return res.status(404).json({ success: false, message: 'Trust not found' });
    }

    // ---- Check if new Email already exists for another Trust ----
    if (email && email !== existingTrust[0].email) {
      const emailCheck = await sequelize.query(
        `SELECT id FROM trusts WHERE email = :email AND id != :id LIMIT 1`,
        { replacements: { email, id }, type: QueryTypes.SELECT }
      );
      if (emailCheck && emailCheck.length > 0) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another trust' });
      }
    }

    // ---- Build dynamic SET clause ----
    const fields = {};
    if (trustName) fields.trust_name = trustName;
    if (email) fields.email = email;
    if (phone) fields.phone = phone;
    if (address) fields.address = address;
    if (password) fields.password = await bcrypt.hash(password, 10);
    if (city) fields.city = city;
    if (state) fields.state = state;
    if (pincode) fields.pincode = pincode;
    if (fullName) fields.full_name = fullName;
    if (designation) fields.designation = designation;
    if (adminEmail) fields.admin_email = adminEmail;
    if (adminPhone) fields.admin_phone = adminPhone;
    if (allot_ids !== undefined) fields.allot_ids = allot_ids;
    if (registrationStatus) fields.registration_status = registrationStatus;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClause = Object.keys(fields)
      .map(key => `${key} = :${key}`)
      .join(', ');

    const query = `
      UPDATE trusts
      SET ${setClause}, updated_at = NOW()
      WHERE id = :id
      RETURNING *;
    `;

    const updatedResult = await sequelize.query(query, {
      replacements: { ...fields, id },
      type: QueryTypes.UPDATE
    });

    const updatedTrust = Array.isArray(updatedResult) ? updatedResult[0] : updatedResult;
    if (updatedTrust) delete updatedTrust.password;

    res.status(200).json({
      success: true,
      message: '✅ Trust updated successfully',
      data: updatedTrust
    });

  } catch (err) {
    console.error('Update Trust Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createTrust, getAllTrusts, updateTrust };
