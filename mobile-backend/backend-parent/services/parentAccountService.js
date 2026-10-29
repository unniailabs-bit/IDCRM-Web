const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");

let parentAccountsReady = null;

async function parentAccountsTableExists() {
    if (parentAccountsReady !== null) return parentAccountsReady;
    try {
        const rows = await sequelize.query(
            `SELECT to_regclass('public.parent_accounts') AS table_name`,
            { type: QueryTypes.SELECT },
        );
        parentAccountsReady = Boolean(rows[0]?.table_name);
    } catch (_) {
        parentAccountsReady = false;
    }
    return parentAccountsReady;
}

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

/** Last 10 digits for Indian mobile numbers (strips +91, spaces, dashes). */
function normalizePhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length < 10) return null;
    return digits.slice(-10);
}

/** SQL expression: normalize a phone column to 10 digits for comparison. */
function phoneSqlExpr(column) {
    return `RIGHT(REGEXP_REPLACE(COALESCE(${column}, ''), '[^0-9]', '', 'g'), 10)`;
}

async function passwordMatches(password, storedPassword) {
    if (!storedPassword) return false;
    if (String(storedPassword).startsWith("$2")) {
        return bcrypt.compare(password, storedPassword);
    }
    return password === storedPassword;
}

async function hashPasswordIfNeeded(password) {
    if (!password) return null;
    if (String(password).startsWith("$2")) return password;
    return bcrypt.hash(String(password), 10);
}

function formatMediaUrl(urlPath) {
    if (!urlPath) return null;
    if (urlPath.startsWith("http")) return urlPath;

    let baseUrl = (process.env.MEDIA_STORAGE_URL || "").replace(/\/$/, "");

    // Use BACKEND_URL for mobile-backend specific uploads (like teacher profile pics)
    if (process.env.BACKEND_URL && (urlPath.includes("profile_pics") || urlPath.includes("uploads/profile_pics"))) {
        baseUrl = process.env.BACKEND_URL.replace(/\/$/, "");
    }

    const cleanPath = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
    return `${baseUrl}${cleanPath}`;
}

function buildStudentUserPayload(student) {
    return {
        id: Number(student.id),
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.father_email,
        class_id: student.class_id,
        division_id: student.division_id,
        school_id: student.school_id,
        roll_number: student.roll_number,
    };
}

function buildTeacherPayload(teacher) {
    return {
        id: Number(teacher.id),
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        school_id: Number(teacher.school_id),
        school_name: teacher.school_name,
        school_logo: formatMediaUrl(teacher.school_logo),
        profile_pic: formatMediaUrl(teacher.profile_pic),
    };
}

const PARENT_TOKEN_EXPIRY = process.env.PARENT_TOKEN_EXPIRY || "90d";

function issueParentToken(student, parentAccountId = null) {
    const payload = {
        id: Number(student.id),
        school_id: Number(student.school_id),
        role: "parent",
    };
    if (parentAccountId) {
        payload.parent_account_id = Number(parentAccountId);
        payload.active_student_id = Number(student.id);
    }
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: PARENT_TOKEN_EXPIRY });
}

/**
 * Refresh a parent/student JWT token.
 * Accepts an expired token (ignoresExpiration) and re-issues a fresh one
 * only if the student record still exists in the DB.
 * Returns null if the token is invalid for any reason other than expiry.
 */
async function refreshParentToken(oldToken) {
    let decoded;
    try {
        decoded = jwt.verify(oldToken, process.env.JWT_SECRET, { ignoreExpiration: true });
    } catch {
        return null; // malformed / wrong secret
    }
    const studentId = decoded.active_student_id || decoded.id;
    const student = await getStudentById(studentId);
    if (!student) return null;

    let parentAccountId = decoded.parent_account_id || null;
    if (!parentAccountId && (await parentAccountsTableExists())) {
        const [link] = await sequelize.query(
            `SELECT parent_account_id FROM parent_student_links WHERE student_form_id = :studentId LIMIT 1`,
            { replacements: { studentId }, type: QueryTypes.SELECT }
        );
        if (link?.parent_account_id) {
            parentAccountId = link.parent_account_id;
        }
    }
    return issueParentToken(student, parentAccountId);
}

const TEACHER_TOKEN_EXPIRY = process.env.TEACHER_TOKEN_EXPIRY || "90d";

function issueTeacherToken(teacher) {
    return jwt.sign(
        {
            id: Number(teacher.id),
            role: "teacher",
            school_id: Number(teacher.school_id),
        },
        process.env.JWT_SECRET,
        { expiresIn: TEACHER_TOKEN_EXPIRY },
    );
}

function issueSelectionToken(payload) {
    return jwt.sign(
        {
            ...payload,
            purpose: "profile_selection",
        },
        process.env.JWT_SECRET,
        { expiresIn: "10m" },
    );
}

function verifySelectionToken(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "profile_selection") {
        throw new Error("Invalid selection token");
    }
    return decoded;
}

async function findMatchingTeachers(phone, password) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return [];

    const teachers = await sequelize.query(
        `
        SELECT t.*, s.school_name, s.logo AS school_logo
        FROM teachers t
        LEFT JOIN schools s ON t.school_id = s.id
        WHERE ${phoneSqlExpr("t.phone")} = :phone
            AND t.status = 'Active'
        ORDER BY t.id ASC
        `,
        { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
    );

    const matched = [];
    for (const teacher of teachers) {
        if (await passwordMatches(password, teacher.password)) {
            matched.push(teacher);
        }
    }
    return matched;
}

async function fetchStudentOptionsByIds(studentIds) {
    if (!studentIds.length) return [];
    return sequelize.query(
        `
        SELECT
            sf.id AS student_id,
            sf.first_name,
            sf.last_name,
            sf.roll_number,
            sf.photo,
            sf.class_id,
            sf.division_id,
            sf.school_id,
            COALESCE(d.class_name, c.class_name) AS class_name,
            d.division_name,
            s.school_name,
            s.logo AS school_logo
        FROM student_forms sf
        LEFT JOIN divisions d ON sf.division_id = d.id
        LEFT JOIN classes c ON COALESCE(d.class_id, sf.class_id) = c.id
        LEFT JOIN schools s ON sf.school_id = s.id
        WHERE sf.id IN (:studentIds)
        ORDER BY sf.first_name ASC, sf.last_name ASC, sf.id ASC
        `,
        { replacements: { studentIds }, type: QueryTypes.SELECT },
    );
}

function mapStudentOption(row) {
    return {
        student_id: Number(row.student_id),
        first_name: row.first_name,
        last_name: row.last_name,
        roll_number: row.roll_number,
        class_name: row.class_name,
        division_name: row.division_name,
        school_id: row.school_id ? Number(row.school_id) : null,
        school_name: row.school_name,
        school_logo: formatMediaUrl(row.school_logo),
        photo: formatMediaUrl(row.photo),
    };
}

function mapTeacherOption(teacher) {
    return {
        teacher_id: Number(teacher.id),
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        school_id: Number(teacher.school_id),
        school_name: teacher.school_name,
        school_logo: formatMediaUrl(teacher.school_logo),
        profile_pic: formatMediaUrl(teacher.profile_pic),
    };
}

async function findLegacyMatchedStudentsByPhone(phone, password) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return [];

    // Check both father_phone and mother_phone so either parent can log in
    const students = await sequelize.query(
        `
        SELECT *
        FROM student_forms
        WHERE ${phoneSqlExpr("father_phone")} = :phone
           OR ${phoneSqlExpr("mother_phone")} = :phone
        ORDER BY id ASC
        `,
        { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
    );

    // De-duplicate in case same student matches on both phone columns
    const seen = new Set();
    const unique = students.filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
    });

    const matched = [];
    for (const student of unique) {
        if (await passwordMatches(password, student.password)) {
            matched.push(student);
        }
    }
    return matched;
}

async function ensureParentAccountForPhone(phone, password, sampleStudent) {
    if (!(await parentAccountsTableExists())) return null;

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return null;

    const [existing] = await sequelize.query(
        `
        SELECT * FROM parent_accounts
        WHERE ${phoneSqlExpr("phone")} = :phone
        LIMIT 1
        `,
        { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
    );

    if (existing) {
        const realEmail = normalizeEmail(sampleStudent?.father_email);
        if (realEmail && existing.email && existing.email.endsWith("@internal.app")) {
            try {
                await sequelize.query(
                    `UPDATE parent_accounts SET email = :email, updated_at = NOW() WHERE id = :id`,
                    { replacements: { email: realEmail, id: existing.id }, type: QueryTypes.UPDATE }
                );
                existing.email = realEmail;
            } catch (_) {}
        }
        return existing;
    }

    const email =
        normalizeEmail(sampleStudent?.father_email) ||
        `phone_${normalizedPhone}@internal.app`;

    const hashed = await hashPasswordIfNeeded(password);

    const [inserted] = await sequelize.query(
        `
        INSERT INTO parent_accounts (email, password, name, phone, created_at, updated_at)
        VALUES (:email, :password, :name, :phone, NOW(), NOW())
        ON CONFLICT (LOWER(email)) DO UPDATE
        SET phone = COALESCE(NULLIF(BTRIM(parent_accounts.phone), ''), EXCLUDED.phone),
            name = COALESCE(parent_accounts.name, EXCLUDED.name),
            updated_at = NOW()
        RETURNING *
        `,
        {
            replacements: {
                email,
                password: hashed,
                name: sampleStudent?.father_name || sampleStudent?.mother_name || null,
                phone: normalizedPhone,
            },
            type: QueryTypes.INSERT,
        },
    );
    return inserted[0];
}

async function ensureLinksForStudents(parentAccountId, students) {
    if (!(await parentAccountsTableExists()) || !parentAccountId) return;
    for (const student of students) {
        await sequelize.query(
            `
            INSERT INTO parent_student_links (parent_account_id, student_form_id, relationship, is_primary)
            VALUES (:parent_account_id, :student_form_id, 'father', false)
            ON CONFLICT (parent_account_id, student_form_id) DO NOTHING
            `,
            {
                replacements: {
                    parent_account_id: parentAccountId,
                    student_form_id: student.id,
                },
                type: QueryTypes.INSERT,
            },
        );
    }
}

async function linkUnlinkedStudentsForAccount(parentAccount) {
    if (!(await parentAccountsTableExists()) || !parentAccount?.id) return;

    const normalizedPhone = normalizePhone(parentAccount.phone);
    const email = parentAccount.email ? normalizeEmail(parentAccount.email) : null;

    if (!normalizedPhone && !email) return;

    let whereClause = [];
    const replacements = { parentAccountId: parentAccount.id };

    if (normalizedPhone) {
        whereClause.push(`${phoneSqlExpr("sf.father_phone")} = :phone`);
        whereClause.push(`${phoneSqlExpr("sf.mother_phone")} = :phone`);
        replacements.phone = normalizedPhone;
    }
    if (email && !email.endsWith("@internal.app")) {
        whereClause.push(`(sf.father_email IS NOT NULL AND LOWER(sf.father_email) = :email)`);
        replacements.email = email;
    }

    await sequelize.query(
        `
        INSERT INTO parent_student_links (parent_account_id, student_form_id, relationship, is_primary)
        SELECT :parentAccountId, sf.id, 'father', false
        FROM student_forms sf
        WHERE (${whereClause.join(" OR ")})
          AND sf.id NOT IN (
              SELECT student_form_id FROM parent_student_links WHERE parent_account_id = :parentAccountId
          )
        ON CONFLICT (parent_account_id, student_form_id) DO NOTHING
        `,
        { replacements, type: QueryTypes.INSERT }
    );

    // NOTE: Do NOT sync parent_accounts password to linked students here.
    // Each student may have their own password set by the school admin.
    // Password sync should ONLY happen on explicit password reset (verifyOtpAndResetPassword).
}

async function authenticateParent(phone, password) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
        return { parentAccount: null, students: [] };
    }

    if (!(await parentAccountsTableExists())) {
        const legacyStudents = await findLegacyMatchedStudentsByPhone(
            normalizedPhone,
            password,
        );
        console.log(`[Auth] No parent_accounts table. Legacy lookup for ${normalizedPhone}: ${legacyStudents.length} matches`);
        return { parentAccount: null, students: legacyStudents };
    }

    let [parentAccount] = await sequelize.query(
        `
        SELECT * FROM parent_accounts
        WHERE ${phoneSqlExpr("phone")} = :phone
        LIMIT 1
        `,
        { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
    );

    if (parentAccount) {
        let accountPasswordOk = await passwordMatches(password, parentAccount.password);
        console.log(`[Auth] parent_accounts id=${parentAccount.id} found for ${normalizedPhone}, password match: ${accountPasswordOk}`);

        if (!accountPasswordOk) {
            // Parent account password doesn't match.
            // Try matching against individual student_forms passwords directly.
            // This handles cases where:
            //   - syncParentPasswordToLinkedStudents previously corrupted passwords
            //   - student password was reset by admin independently
            //   - parent_accounts hash is stale

            // Strategy 1: phone-based lookup in student_forms
            const legacyCandidates = await findLegacyMatchedStudentsByPhone(normalizedPhone, password);
            console.log(`[Auth] Legacy phone fallback for ${normalizedPhone}: ${legacyCandidates.length} matches`);

            if (legacyCandidates.length === 0) {
                // Strategy 2: check each linked student's own password
                const linkedCandidates = await sequelize.query(
                    `
                    SELECT sf.*
                    FROM parent_student_links psl
                    JOIN student_forms sf ON sf.id = psl.student_form_id
                    WHERE psl.parent_account_id = :parentAccountId
                    ORDER BY sf.id ASC
                    `,
                    { replacements: { parentAccountId: parentAccount.id }, type: QueryTypes.SELECT },
                );
                console.log(`[Auth] Checking ${linkedCandidates.length} linked students for password match`);

                for (const student of linkedCandidates) {
                    if (await passwordMatches(password, student.password)) {
                        legacyCandidates.push(student);
                        console.log(`[Auth] Linked student id=${student.id} password matched`);
                        break;
                    }
                }
            }

            if (legacyCandidates.length > 0) {
                // Update parent_accounts password to the correct one
                const hashed = await hashPasswordIfNeeded(password);
                await sequelize.query(
                    `UPDATE parent_accounts SET password = :password, updated_at = NOW() WHERE id = :id`,
                    { replacements: { password: hashed, id: parentAccount.id }, type: QueryTypes.UPDATE },
                );
                parentAccount.password = hashed;
                accountPasswordOk = true;
                console.log(`[Auth] parent_accounts id=${parentAccount.id} password updated from fallback`);
            }
        }

        if (!accountPasswordOk) {
            console.log(`[Auth] All password checks failed for ${normalizedPhone}`);
            return { parentAccount: null, students: [] };
        }

        await linkUnlinkedStudentsForAccount(parentAccount);

        const linkedStudents = await sequelize.query(
            `
            SELECT sf.*
            FROM parent_student_links psl
            JOIN student_forms sf ON sf.id = psl.student_form_id
            WHERE psl.parent_account_id = :parentAccountId
            ORDER BY sf.first_name ASC, sf.last_name ASC, sf.id ASC
            `,
            {
                replacements: { parentAccountId: parentAccount.id },
                type: QueryTypes.SELECT,
            },
        );
        console.log(`[Auth] Returning ${linkedStudents.length} linked students for parent_accounts id=${parentAccount.id}`);

        if (parentAccount.email && parentAccount.email.endsWith("@internal.app")) {
            const realEmail = normalizeEmail(linkedStudents.find((s) => normalizeEmail(s.father_email))?.father_email);
            if (realEmail) {
                try {
                    await sequelize.query(
                        `UPDATE parent_accounts SET email = :email, updated_at = NOW() WHERE id = :id`,
                        { replacements: { email: realEmail, id: parentAccount.id }, type: QueryTypes.UPDATE }
                    );
                    parentAccount.email = realEmail;
                } catch (_) {}
            }
        }

        return { parentAccount, students: linkedStudents };
    }

    const legacyStudents = await findLegacyMatchedStudentsByPhone(
        normalizedPhone,
        password,
    );
    if (legacyStudents.length === 0) {
        return { parentAccount: null, students: [] };
    }

    const sampleStudent =
        legacyStudents.find((s) => normalizeEmail(s.father_email)) ||
        legacyStudents[0];

    const account = await ensureParentAccountForPhone(
        normalizedPhone,
        password,
        sampleStudent,
    );

    if (account) {
        const hashed = await hashPasswordIfNeeded(password);
        if (hashed && !account.password) {
            await sequelize.query(
                `UPDATE parent_accounts SET password = :password, updated_at = NOW() WHERE id = :id`,
                { replacements: { password: hashed, id: account.id }, type: QueryTypes.UPDATE },
            );
            account.password = hashed;
        }
        await ensureLinksForStudents(account.id, legacyStudents);
        await linkUnlinkedStudentsForAccount(account);

        const linkedStudents = await sequelize.query(
            `
            SELECT sf.*
            FROM parent_student_links psl
            JOIN student_forms sf ON sf.id = psl.student_form_id
            WHERE psl.parent_account_id = :parentAccountId
            ORDER BY sf.first_name ASC, sf.last_name ASC, sf.id ASC
            `,
            {
                replacements: { parentAccountId: account.id },
                type: QueryTypes.SELECT,
            },
        );
        return { parentAccount: account, students: linkedStudents.length > 0 ? linkedStudents : legacyStudents };
    }

    return { parentAccount: null, students: legacyStudents };
}

async function getLinkedStudentsForAccount(parentAccountId) {
    if (!(await parentAccountsTableExists()) || !parentAccountId) return [];

    const [parentAccount] = await sequelize.query(
        `SELECT * FROM parent_accounts WHERE id = :parentAccountId LIMIT 1`,
        { replacements: { parentAccountId }, type: QueryTypes.SELECT }
    );

    if (parentAccount) {
        await linkUnlinkedStudentsForAccount(parentAccount);
    }

    const rows = await sequelize.query(
        `
        SELECT
            sf.id AS student_id,
            sf.first_name,
            sf.last_name,
            sf.roll_number,
            sf.photo,
            sf.class_id,
            sf.division_id,
            sf.school_id,
            COALESCE(d.class_name, c.class_name) AS class_name,
            d.division_name,
            s.school_name,
            s.logo AS school_logo
        FROM parent_student_links psl
        JOIN student_forms sf ON sf.id = psl.student_form_id
        LEFT JOIN divisions d ON sf.division_id = d.id
        LEFT JOIN classes c ON COALESCE(d.class_id, sf.class_id) = c.id
        LEFT JOIN schools s ON sf.school_id = s.id
        WHERE psl.parent_account_id = :parentAccountId
        ORDER BY sf.first_name ASC, sf.last_name ASC, sf.id ASC
        `,
        {
            replacements: { parentAccountId },
            type: QueryTypes.SELECT,
        },
    );
    return rows.map(mapStudentOption);
}

async function studentLinkedToParent(parentAccountId, studentId) {
    if (!(await parentAccountsTableExists()) || !parentAccountId) return false;
    const [row] = await sequelize.query(
        `
        SELECT 1
        FROM parent_student_links
        WHERE parent_account_id = :parentAccountId
            AND student_form_id = :studentId
        LIMIT 1
        `,
        {
            replacements: { parentAccountId, studentId },
            type: QueryTypes.SELECT,
        },
    );
    if (row) return true;

    const [parentAccount] = await sequelize.query(
        `SELECT * FROM parent_accounts WHERE id = :parentAccountId LIMIT 1`,
        { replacements: { parentAccountId }, type: QueryTypes.SELECT }
    );
    if (parentAccount) {
        await linkUnlinkedStudentsForAccount(parentAccount);
        const [checkAgain] = await sequelize.query(
            `SELECT 1 FROM parent_student_links WHERE parent_account_id = :parentAccountId AND student_form_id = :studentId LIMIT 1`,
            { replacements: { parentAccountId, studentId }, type: QueryTypes.SELECT }
        );
        return Boolean(checkAgain);
    }
    return false;
}

async function getStudentById(studentId) {
    const [student] = await sequelize.query(
        `SELECT * FROM student_forms WHERE id = :id LIMIT 1`,
        { replacements: { id: studentId }, type: QueryTypes.SELECT },
    );
    return student || null;
}

async function getTeacherById(teacherId) {
    const [teacher] = await sequelize.query(
        `
        SELECT t.*, s.school_name, s.logo AS school_logo
        FROM teachers t
        LEFT JOIN schools s ON t.school_id = s.id
        WHERE t.id = :id AND t.status = 'Active'
        LIMIT 1
        `,
        { replacements: { id: teacherId }, type: QueryTypes.SELECT },
    );
    return teacher || null;
}

async function migratePlainStudentPassword(studentId, password, storedPassword) {
    if (storedPassword && !String(storedPassword).startsWith("$2")) {
        const hashed = await bcrypt.hash(password, 10);
        await sequelize.query(
            `UPDATE student_forms SET password = :hashed WHERE id = :id`,
            { replacements: { hashed, id: studentId }, type: QueryTypes.UPDATE },
        );
    }
}

async function syncParentPasswordToLinkedStudents(parentAccountId, hashedPassword) {
    if (!(await parentAccountsTableExists()) || !parentAccountId) return;
    await sequelize.query(
        `
        UPDATE student_forms sf
        SET password = :hashed
        FROM parent_student_links psl
        WHERE psl.student_form_id = sf.id
            AND psl.parent_account_id = :parentAccountId
        `,
        {
            replacements: { hashed: hashedPassword, parentAccountId },
            type: QueryTypes.UPDATE,
        },
    );
}

module.exports = {
    refreshParentToken,
    parentAccountsTableExists,
    normalizeEmail,
    normalizePhone,
    phoneSqlExpr,
    passwordMatches,
    hashPasswordIfNeeded,
    formatMediaUrl,
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
    findLegacyMatchedStudentsByPhone,
    authenticateParent,
    getLinkedStudentsForAccount,
    studentLinkedToParent,
    getStudentById,
    getTeacherById,
    migratePlainStudentPassword,
    syncParentPasswordToLinkedStudents,
    ensureLinksForStudents,
    linkUnlinkedStudentsForAccount,
};