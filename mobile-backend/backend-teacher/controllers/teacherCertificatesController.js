const path = require('path');
const fs = require('fs');
const sequelize = require('../../config/db'); // ✅ import correctly
const { QueryTypes } = require('sequelize');

// ================================
// POST - Add Certificate (with optional image)
// ================================
exports.addCertificate = async (req, res) => {
  try {
    const teacher = req.teacher;
    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { awarded_to, class_id, division_id, certificate_title, category, date_awarded } = req.body;

    if (!awarded_to || !class_id || !division_id || !certificate_title || !category || !date_awarded) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Sanitize inputs (remove extra quotes)
    const sanitize = (val) => (typeof val === 'string' ? val.replace(/^"|"$/g, '') : val);
    const cleanAwardedTo = sanitize(awarded_to);
    const cleanCertificateTitle = sanitize(certificate_title);
    const cleanCategory = sanitize(category);

    // Handle file upload
    let certificate_image = null;
    if (req.file) {
      certificate_image = `/uploads/certificates/${req.file.filename}`;
    }

    // Insert into DB
    const [result] = await sequelize.query(
      `
      INSERT INTO teacher_certificates
        (teacher_id, school_id, awarded_to, class_id, division_id, certificate_title, category, date_awarded, certificate_image)
      VALUES
        (:teacher_id, :school_id, :awarded_to, :class_id, :division_id, :certificate_title, :category, :date_awarded, :certificate_image)
      RETURNING *
      `,
      {
        replacements: {
          teacher_id: teacher.id,
          school_id: teacher.school_id,
          awarded_to: cleanAwardedTo,
          class_id,
          division_id,
          certificate_title: cleanCertificateTitle,
          category: cleanCategory,
          date_awarded,
          certificate_image
        },
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json({
      success: true,
      message: 'Certificate uploaded successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Add Certificate Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ================================
// GET - All Certificates for Teacher
// ================================
exports.getCertificates = async (req, res) => {
  try {
    const teacher = req.teacher;
    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const certificates = await sequelize.query(
      `
      SELECT tc.*, 
             sf.first_name AS student_first_name,
             sf.last_name AS student_last_name,
             c.class_name,
             d.division_name
      FROM teacher_certificates tc
      JOIN student_forms sf ON sf.id = tc.awarded_to
      JOIN classes c ON c.id = tc.class_id
      JOIN divisions d ON d.id = tc.division_id
      WHERE tc.teacher_id = :teacher_id
      ORDER BY tc.date_awarded DESC
      `,
      {
        replacements: { teacher_id: teacher.id },
        type: QueryTypes.SELECT
      }
    );

    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

    const result = certificates.map(cert => ({
      ...cert,
      certificate_image: cert.certificate_image
        ? `${baseUrl}${cert.certificate_image}`
        : null
    }));

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });

  } catch (error) {
    console.error('Get Certificates Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ================================
// GET - Single Certificate by ID
// ================================
exports.getCertificateById = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id } = req.params;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [certificate] = await sequelize.query(
      `
      SELECT tc.*, 
             sf.first_name AS student_first_name,
             sf.last_name AS student_last_name,
             c.class_name,
             d.division_name
      FROM teacher_certificates tc
      JOIN student_forms sf ON sf.id = tc.awarded_to
      JOIN classes c ON c.id = tc.class_id
      JOIN divisions d ON d.id = tc.division_id
      WHERE tc.teacher_id = :teacher_id AND tc.id = :id
      `,
      { replacements: { teacher_id: teacher.id, id }, type: QueryTypes.SELECT }
    );

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

    certificate.certificate_image = certificate.certificate_image
      ? `${baseUrl}${certificate.certificate_image}`
      : null;

    res.status(200).json({ success: true, data: certificate });

  } catch (error) {
    console.error('Get Certificate By ID Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ================================
// DELETE - Certificate by ID
// ================================
exports.deleteCertificate = async (req, res) => {
  try {
    const teacher = req.teacher;
    const { id } = req.params;

    if (!teacher || !teacher.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [certificate] = await sequelize.query(
      `SELECT * FROM teacher_certificates WHERE id = :id AND teacher_id = :teacher_id`,
      { replacements: { id, teacher_id: teacher.id }, type: QueryTypes.SELECT }
    );

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    if (certificate.certificate_image) {
      const filePath = path.join(__dirname, '..', certificate.certificate_image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await sequelize.query(
      `DELETE FROM teacher_certificates WHERE id = :id AND teacher_id = :teacher_id`,
      { replacements: { id, teacher_id: teacher.id }, type: QueryTypes.DELETE }
    );

    res.status(200).json({ success: true, message: 'Certificate deleted successfully' });

  } catch (error) {
    console.error('Delete Certificate Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
