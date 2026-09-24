const sequelize = require("../../config/db");
const { QueryTypes } = require("sequelize");
const path = require("path");
const fs = require("fs");
const AdmZip = require("adm-zip");

// =======================
// BULK UPLOAD STUDENT PHOTOS (ZIP)
// =======================
const bulkUploadPhotos = async (req, res) => {
    try {
        const teacherId = req.user?.id;
        if (!teacherId)
            return res.status(400).json({ success: false, message: "Teacher ID missing" });

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No zip file uploaded" });
        }

        // 1) Verify teacher
        const teacher = await sequelize.query(
            `SELECT name FROM teachers WHERE id = :id`,
            { replacements: { id: teacherId }, type: QueryTypes.SELECT }
        );

        if (!teacher.length) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const { class_id, division_id } = req.body;
        const uploadsDir = path.join(__dirname, '../../uploads');

        const results = {
            success: [],
            failed: []
        };

        try {
            // 2) Open Zip
            const zip = new AdmZip(req.file.path);
            const zipEntries = zip.getEntries();

            // --- BATCH OPTIMIZATION: STEP 1 (Gather GRs) ---
            const grNumbers = [];
            const validEntries = [];

            for (const entry of zipEntries) {
                if (entry.isDirectory) continue;
                const ext = path.extname(entry.name).toLowerCase();
                if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                    results.failed.push({ file: entry.name, reason: "Skipped (Not an image)" });
                    continue;
                }
                const gr = path.parse(entry.name).name;
                grNumbers.push(gr);
                validEntries.push({ entry, gr });
            }

            if (grNumbers.length === 0) {
                return res.json({ success: true, message: "No valid images found in ZIP", summary: { total_entries: 0, success_count: 0, failed_count: 0 }, details: results });
            }

            // --- BATCH OPTIMIZATION: STEP 2 (Single DB Call for all students) ---
            // Include teacher_id for more robust authorization
            const students = await sequelize.query(
                `SELECT id, class_id, division_id, teacher_id, first_name, last_name, gr_number 
                 FROM student_forms 
                 WHERE gr_number IN (:grNumbers)`,
                { replacements: { grNumbers }, type: QueryTypes.SELECT }
            );

            // --- BATCH OPTIMIZATION: STEP 3 (Single DB Call for teacher auth) ---
            const authorizedDivisions = await sequelize.query(
                `SELECT id FROM divisions 
                 WHERE class_teacher = (SELECT name FROM teachers WHERE id = :teacherId LIMIT 1)`,
                { replacements: { teacherId }, type: QueryTypes.SELECT }
            );

            const authDivIds = new Set(authorizedDivisions.map(d => Number(d.id)));

            // Group students by GR number to handle duplicates
            const studentMap = students.reduce((acc, s) => {
                if (!acc[s.gr_number]) acc[s.gr_number] = [];
                acc[s.gr_number].push(s);
                return acc;
            }, {});

            // ROBUST ID VALIDATION: Handle cases where frontend sends "undefined" or "null" as strings
            const parsedClassId = parseInt(class_id);
            const parsedDivId = parseInt(division_id);

            const transaction = await sequelize.transaction();
            try {
                // 3) Process entries loop
                for (const { entry, gr } of validEntries) {
                    const originalName = entry.name;
                    const matchingStudents = studentMap[gr];

                    if (!matchingStudents || matchingStudents.length === 0) {
                        results.failed.push({ file: originalName, gr_number: gr, reason: "GR Number not found in database" });
                        continue;
                    }

                    // Find an authorized student among duplicates
                    const s = matchingStudents.find(student =>
                        authDivIds.has(Number(student.division_id)) || Number(student.teacher_id) === Number(teacherId)
                    );

                    if (!s) {
                        results.failed.push({ file: originalName, gr_number: gr, reason: "Not authorized for this student" });
                        continue;
                    }

                    // Safe Filter Comparison
                    if (!isNaN(parsedClassId) && parsedClassId !== s.class_id) {
                        results.failed.push({ file: originalName, gr_number: gr, reason: `Class mismatch (Student is in Class ID ${s.class_id})` });
                        continue;
                    }
                    if (!isNaN(parsedDivId) && parsedDivId !== s.division_id) {
                        results.failed.push({ file: originalName, gr_number: gr, reason: `Division mismatch (Student is in Division ID ${s.division_id})` });
                        continue;
                    }

                    const uniqueFilename = `extracted-${Date.now()}-${originalName}`;
                    const targetPath = path.join(uploadsDir, uniqueFilename);
                    const photoUrl = `${backendUrl}/uploads/${uniqueFilename}`;

                    try {
                        zip.extractEntryTo(entry, uploadsDir, false, true);
                        const extractedPath = path.join(uploadsDir, entry.name);
                        fs.renameSync(extractedPath, targetPath);

                        await sequelize.query(
                            `UPDATE student_forms SET photo = :photo, updated_at = NOW() WHERE id = :id`,
                            {
                                replacements: { photo: photoUrl, id: s.id },
                                type: QueryTypes.UPDATE,
                                transaction
                            }
                        );

                        results.success.push({
                            file: originalName,
                            gr_number: gr,
                            student_name: `${s.first_name} ${s.last_name}`.trim(),
                            message: "Updated successfully"
                        });
                    } catch (err) {
                        console.error(`Error processing ${originalName}:`, err);
                        results.failed.push({ file: originalName, gr_number: gr, reason: "Process error" });
                    }
                }
                await transaction.commit();
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (zipError) {
            console.error("Zip processing error:", zipError);
            return res.status(400).json({ success: false, message: "Invalid ZIP file" });
        } finally {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }

        return res.json({
            success: true,
            message: "Bulk upload ZIP processing complete",
            summary: {
                total_entries: results.success.length + results.failed.length,
                success_count: results.success.length,
                failed_count: results.failed.length
            },
            details: results
        });
    } catch (err) {
        console.error("🔥 Error in bulkUploadPhotos:", err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const bulkUploadSignatures = async (req, res) => {
    try {
        const teacherId = req.user?.id;
        if (!teacherId)
            return res.status(400).json({ success: false, message: "Teacher ID missing" });

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No zip file uploaded" });
        }

        const teacher = await sequelize.query(
            `SELECT name FROM teachers WHERE id = :id`,
            { replacements: { id: teacherId }, type: QueryTypes.SELECT }
        );

        if (!teacher.length) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const { class_id, division_id } = req.body;
        const uploadsDir = path.join(__dirname, '../../uploads');

        const results = {
            success: [],
            failed: []
        };

        try {
            const zip = new AdmZip(req.file.path);
            const zipEntries = zip.getEntries();

            const grNumbers = [];
            const validEntries = [];

            for (const entry of zipEntries) {
                if (entry.isDirectory) continue;
                const ext = path.extname(entry.name).toLowerCase();
                if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                    results.failed.push({ file: entry.name, reason: "Skipped (Not an image)" });
                    continue;
                }
                const gr = path.parse(entry.name).name;
                grNumbers.push(gr);
                validEntries.push({ entry, gr });
            }

            if (grNumbers.length === 0) {
                return res.json({ success: true, message: "No valid images found", summary: { total_entries: 0, success_count: 0, failed_count: 0 }, details: results });
            }

            // Include teacher_id for more robust authorization
            const students = await sequelize.query(
                `SELECT id, class_id, division_id, teacher_id, first_name, last_name, gr_number 
                 FROM student_forms 
                 WHERE gr_number IN (:grNumbers)`,
                { replacements: { grNumbers }, type: QueryTypes.SELECT }
            );

            const authorizedDivisions = await sequelize.query(
                `SELECT id FROM divisions 
                 WHERE class_teacher = (SELECT name FROM teachers WHERE id = :teacherId LIMIT 1)`,
                { replacements: { teacherId }, type: QueryTypes.SELECT }
            );

            // Group students by GR number to handle duplicates
            const studentMap = students.reduce((acc, s) => {
                if (!acc[s.gr_number]) acc[s.gr_number] = [];
                acc[s.gr_number].push(s);
                return acc;
            }, {});

            const authDivIds = new Set(authorizedDivisions.map(d => Number(d.id)));
            const parsedClassId = parseInt(class_id);
            const parsedDivId = parseInt(division_id);

            const transaction = await sequelize.transaction();
            try {
                for (const { entry, gr } of validEntries) {
                    const originalName = entry.name;
                    const matchingStudents = studentMap[gr];

                    if (!matchingStudents || matchingStudents.length === 0) {
                        results.failed.push({ file: originalName, gr_number: gr, reason: "GR Number not found" });
                        continue;
                    }

                    // Robust Authorization: Search all duplicates for a match
                    const s = matchingStudents.find(student =>
                        authDivIds.has(Number(student.division_id)) || Number(student.teacher_id) === Number(teacherId)
                    );

                    if (!s) {
                        results.failed.push({ file: originalName, gr_number: gr, reason: "Not authorized" });
                        continue;
                    }

                    if (!isNaN(parsedClassId) && parsedClassId !== s.class_id) {
                        results.failed.push({ file: originalName, gr_number: gr, reason: `Class mismatch (${s.class_id})` });
                        continue;
                    }
                    if (!isNaN(parsedDivId) && parsedDivId !== s.division_id) {
                        results.failed.push({ file: originalName, gr_number: gr, reason: `Division mismatch (${s.division_id})` });
                        continue;
                    }

                    const uniqueFilename = `signature-${Date.now()}-${originalName}`;
                    const targetPath = path.join(uploadsDir, uniqueFilename);
                    const signatureUrl = `${backendUrl}/uploads/${uniqueFilename}`;

                    try {
                        zip.extractEntryTo(entry, uploadsDir, false, true);
                        const extractedPath = path.join(uploadsDir, entry.name);
                        fs.renameSync(extractedPath, targetPath);

                        await sequelize.query(
                            `UPDATE student_forms SET student_signature = :signature, updated_at = NOW() WHERE id = :id`,
                            {
                                replacements: { signature: signatureUrl, id: s.id },
                                type: QueryTypes.UPDATE,
                                transaction
                            }
                        );

                        results.success.push({
                            file: originalName,
                            gr_number: gr,
                            student_name: `${s.first_name} ${s.last_name}`.trim(),
                            message: "Signature updated successfully"
                        });
                    } catch (err) {
                        console.error(`Error processing signature ${originalName}:`, err);
                        results.failed.push({ file: originalName, gr_number: gr, reason: "Process error" });
                    }
                }
                await transaction.commit();
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (zipError) {
            console.error("Zip processing error:", zipError);
            return res.status(400).json({ success: false, message: "Invalid ZIP file" });
        } finally {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }

        return res.json({
            success: true,
            message: "Bulk signature upload complete",
            summary: {
                total_entries: results.success.length + results.failed.length,
                success_count: results.success.length,
                failed_count: results.failed.length
            },
            details: results
        });
    } catch (err) {
        console.error("🔥 Error in bulkUploadSignatures:", err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { bulkUploadPhotos, bulkUploadSignatures };
