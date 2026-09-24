const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcryptjs');

// ---------------- Get School Profile ----------------
exports.getSchoolProfile = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    
    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    const school = await sequelize.query(
      `SELECT 
        id, school_name, school_code, email, phone, address, city, state, pincode, 
        section, school_admin_name, created_at, updated_at
       FROM schools 
       WHERE id = :school_id`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    return res.status(200).json({ success: true, data: school[0] });
  } catch (error) {
    console.error('Get School Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching school profile' });
  }
};

// ---------------- Update School Profile ----------------
exports.updateSchoolProfile = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const { school_name, email, phone, address, city, state, pincode, school_admin_name } = req.body;

    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    const updates = [];
    const replacements = { school_id: schoolId };

    if (school_name) {
      updates.push('school_name = :school_name');
      replacements.school_name = school_name.trim();
    }
    if (email) {
      updates.push('email = :email');
      replacements.email = email.trim();
    }
    if (phone) {
      updates.push('phone = :phone');
      replacements.phone = phone.trim();
    }
    if (address) {
      updates.push('address = :address');
      replacements.address = address.trim();
    }
    if (city) {
      updates.push('city = :city');
      replacements.city = city.trim();
    }
    if (state) {
      updates.push('state = :state');
      replacements.state = state.trim();
    }
    if (pincode) {
      updates.push('pincode = :pincode');
      replacements.pincode = pincode.trim();
    }
    if (school_admin_name) {
      updates.push('school_admin_name = :school_admin_name');
      replacements.school_admin_name = school_admin_name.trim();
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');

    const query = `
      UPDATE schools 
      SET ${updates.join(', ')}
      WHERE id = :school_id
      RETURNING id, school_name, school_code, email, phone, address, city, state, pincode, 
                section, school_admin_name, created_at, updated_at;
    `;

    const [result] = await sequelize.query(query, { replacements, type: QueryTypes.UPDATE });

    return res.status(200).json({ 
      success: true, 
      message: 'School profile updated successfully', 
      data: result[0] 
    });
  } catch (error) {
    console.error('Update School Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating school profile' });
  }
};

// ---------------- Change Password ----------------
exports.changePassword = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const { currentPassword, newPassword } = req.body;

    if (!schoolId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: School ID missing' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // Get current password
    const school = await sequelize.query(
      `SELECT password FROM schools WHERE id = :school_id`,
      { replacements: { school_id: schoolId }, type: QueryTypes.SELECT }
    );

    if (!school.length) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, school[0].password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await sequelize.query(
      `UPDATE schools SET password = :password, updated_at = NOW() WHERE id = :school_id`,
      { replacements: { password: hashedPassword, school_id: schoolId }, type: QueryTypes.UPDATE }
    );

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while changing password' });
  }
};

