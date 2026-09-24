const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerTrust = async (req, res) => {
  try {
    const trust_id = req.user?.id;

    const {
      trust_name,
      registration_number,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      full_name,
      designation,
      admin_email,
      admin_phone,
      username,
      password
    } = req.body;

    // Validation Check - Only trust details required, super admin fields are optional
    if (
      !trust_name || !registration_number || !email || !phone || !address ||
      !city || !state || !pincode || !password
    ) {
      return res.status(400).json({ success: false, message: "Trust name, registration number, email, phone, address, city, state, pincode, and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let trust;

    if (!trust_id) {
      // CREATE NEW TRUST

      // Generate custom_id (ash-tr-001, ash-tr-002, ...)
      const lastTrust = await sequelize.query(
        `SELECT custom_id FROM trusts WHERE custom_id LIKE 'ash-tr-%' ORDER BY id DESC LIMIT 1`,
        { type: QueryTypes.SELECT }
      );

      let newCustomId = 'ash-tr-001';
      if (lastTrust.length > 0 && lastTrust[0].custom_id) {
        const lastNumber = parseInt(lastTrust[0].custom_id.split('-')[2], 10);
        newCustomId = `ash-tr-${String(lastNumber + 1).padStart(3, '0')}`;
      }

      const createQuery = `
        INSERT INTO trusts (
          trust_name, registration_number, email, phone, address,
          city, state, pincode, full_name, designation,
          admin_email, admin_phone, username, password, registration_status,
          custom_id, created_at, updated_at
        )
        VALUES (
          :trust_name, :registration_number, :email, :phone, :address,
          :city, :state, :pincode, :full_name, :designation,
          :admin_email, :admin_phone, :username, :password, 'pending',
          :custom_id, NOW(), NOW()
        )
        RETURNING *;
      `;

      trust = await sequelize.query(createQuery, {
        replacements: {
          trust_name,
          registration_number,
          email,
          phone,
          address,
          city,
          state,
          pincode,
          full_name: full_name || null,
          designation: designation || null,
          admin_email: admin_email || null,
          admin_phone: admin_phone || null,
          username: username || null,
          password: hashedPassword,
          custom_id: newCustomId
        },
        type: QueryTypes.RAW,
      });

    } else {
      // UPDATE TRUST (no change in custom_id)
      const updateQuery = `
        UPDATE trusts
        SET
          trust_name = :trust_name,
          registration_number = :registration_number,
          email = :email,
          phone = :phone,
          address = :address,
          city = :city,
          state = :state,
          pincode = :pincode,
          full_name = :full_name,
          designation = :designation,
          admin_email = :admin_email,
          admin_phone = :admin_phone,
          username = :username,
          password = :password,
          registration_status = 'pending',
          updated_at = NOW()
        WHERE id = :trust_id
        RETURNING *;
      `;

      trust = await sequelize.query(updateQuery, {
        replacements: {
          trust_id,
          trust_name,
          registration_number,
          email,
          phone,
          address,
          city,
          state,
          pincode,
          full_name: full_name || null,
          designation: designation || null,
          admin_email: admin_email || null,
          admin_phone: admin_phone || null,
          username: username || null,
          password: hashedPassword
        },
        type: QueryTypes.RAW
      });
    }

    const trustData = trust[0][0];

    const token = jwt.sign(
      { id: trustData.id, role: "trust" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(trust_id ? 200 : 201).json({
      success: true,
      message: trust_id
        ? "Trust Updated Successfully 🔄"
        : "Trust Registered Successfully 🎉",
      token,
      trust: trustData
    });

  } catch (err) {
    console.error("Trust Registration Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while registering trust"
    });
  }
};

module.exports = { registerTrust };
