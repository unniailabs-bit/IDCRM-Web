const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');

// ---------------- Add Appointment ----------------
exports.addAppointment = async (req, res) => {
  try {
    const { 
      school_id, 
      teacher_name, 
      designation, 
      email, 
      phone_number, 
      available_from, 
      available_to, 
      operational_notes 
    } = req.body;

    if (!school_id || !teacher_name) {
      return res.status(400).json({ success: false, message: 'School ID and Teacher Name are required' });
    }

    const query = `
      INSERT INTO appointments (
        school_id, teacher_name, designation, email, phone_number, 
        available_from, available_to, operational_notes, created_at, updated_at
      )
      VALUES (
        :school_id, :teacher_name, :designation, :email, :phone_number, 
        :available_from, :available_to, :operational_notes, NOW(), NOW()
      )
      RETURNING *;
    `;

    const replacements = {
      school_id,
      teacher_name,
      designation: designation || null,
      email: email || null,
      phone_number: phone_number || null,
      available_from: available_from || null,
      available_to: available_to || null,
      operational_notes: operational_notes || null
    };

    const [result] = await sequelize.query(query, { replacements, type: QueryTypes.INSERT });

    res.status(201).json({ success: true, message: '✅ Appointment added successfully', data: result[0] });

  } catch (error) {
    console.error('Add Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Get Appointments for School ----------------
exports.getAppointments = async (req, res) => {
  try {
    const { school_id } = req.params;

    if (!school_id) {
      return res.status(400).json({ success: false, message: 'School ID is required' });
    }

    const appointments = await sequelize.query(
      `SELECT * FROM appointments WHERE school_id = :school_id ORDER BY id DESC`,
      { replacements: { school_id }, type: QueryTypes.SELECT }
    );

    res.status(200).json({ success: true, data: appointments });

  } catch (error) {
    console.error('Get Appointments Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Update Appointment ----------------
exports.updateAppointment = async (req, res) => {
  try {
    const { appointment_id } = req.params;
    const { 
      teacher_name, 
      designation, 
      email, 
      phone_number, 
      available_from, 
      available_to, 
      operational_notes 
    } = req.body;

    if (!appointment_id) {
      return res.status(400).json({ success: false, message: 'Appointment ID is required' });
    }

    const updates = [];
    const replacements = { appointment_id };

    if (teacher_name !== undefined) { updates.push('teacher_name = :teacher_name'); replacements.teacher_name = teacher_name; }
    if (designation !== undefined) { updates.push('designation = :designation'); replacements.designation = designation; }
    if (email !== undefined) { updates.push('email = :email'); replacements.email = email; }
    if (phone_number !== undefined) { updates.push('phone_number = :phone_number'); replacements.phone_number = phone_number; }
    if (available_from !== undefined) { updates.push('available_from = :available_from'); replacements.available_from = available_from; }
    if (available_to !== undefined) { updates.push('available_to = :available_to'); replacements.available_to = available_to; }
    if (operational_notes !== undefined) { updates.push('operational_notes = :operational_notes'); replacements.operational_notes = operational_notes; }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');

    const query = `
      UPDATE appointments 
      SET ${updates.join(', ')}
      WHERE id = :appointment_id
      RETURNING *;
    `;

    const [result] = await sequelize.query(query, { replacements, type: QueryTypes.UPDATE });

    if (!result.length) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({ success: true, message: '✅ Appointment updated successfully', data: result[0] });

  } catch (error) {
    console.error('Update Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Delete Appointment ----------------
exports.deleteAppointment = async (req, res) => {
  try {
    const { appointment_id } = req.params;

    if (!appointment_id) {
      return res.status(400).json({ success: false, message: 'Appointment ID is required' });
    }

    await sequelize.query(
      `DELETE FROM appointments WHERE id = :appointment_id`,
      { replacements: { appointment_id }, type: QueryTypes.DELETE }
    );

    res.status(200).json({ success: true, message: '✅ Appointment deleted successfully' });

  } catch (error) {
    console.error('Delete Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
