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
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" });
}

function issueTeacherToken(teacher) {
    return jwt.sign(
        {
            id: Number(teacher.id),
            role: "teacher",
            school_id: Number(teacher.school_id),
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" },
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
            c.class_name,
            d.division_name,
            s.school_name,
            s.logo AS school_logo
        FROM student_forms sf
        LEFT JOIN classes c ON sf.class_id = c.id
        LEFT JOIN divisions d ON sf.division_id = d.id
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

    const students = await sequelize.query(
        `
        SELECT *
        FROM student_forms
        WHERE ${phoneSqlExpr("father_phone")} = :phone
        ORDER BY id ASC
        `,
        { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
    );

    const matched = [];
    for (const student of students) {
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

    if (existing) return existing;

    const hashed = await hashPasswordIfNeeded(password);
    const email =
        sampleStudent?.father_email
            ? normalizeEmail(sampleStudent.father_email)
            : null;

    const [inserted] = await sequelize.query(
        `
        INSERT INTO parent_accounts (email, password, name, phone, created_at, updated_at)
        VALUES (:email, :password, :name, :phone, NOW(), NOW())
        RETURNING *
        `,
        {
            replacements: {
                email,
                password: hashed,
                name: sampleStudent?.father_name || null,
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
        return { parentAccount: null, students: legacyStudents };
    }

    const [parentAccount] = await sequelize.query(
        `
        SELECT * FROM parent_accounts
        WHERE ${phoneSqlExpr("phone")} = :phone
        LIMIT 1
        `,
        { replacements: { phone: normalizedPhone }, type: QueryTypes.SELECT },
    );

    if (parentAccount) {
        const accountPasswordOk = await passwordMatches(password, parentAccount.password);
        if (!accountPasswordOk) {
            return { parentAccount: null, students: [] };
        }

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

        if (linkedStudents.length > 0) {
            return { parentAccount, students: linkedStudents };
        }
    }

    const legacyStudents = await findLegacyMatchedStudentsByPhone(
        normalizedPhone,
        password,
    );
    if (legacyStudents.length === 0) {
        return { parentAccount: null, students: [] };
    }

    const account =
        parentAccount ||
        (await ensureParentAccountForPhone(
            normalizedPhone,
            password,
            legacyStudents[0],
        ));
    await ensureLinksForStudents(account.id, legacyStudents);

    if (!parentAccount && account) {
        const hashed = await hashPasswordIfNeeded(password);
        if (hashed && !account.password) {
            await sequelize.query(
                `UPDATE parent_accounts SET password = :password, updated_at = NOW() WHERE id = :id`,
                {
                    replacements: { password: hashed, id: account.id },
                    type: QueryTypes.UPDATE,
                },
            );
        }
    }

    return { parentAccount: account, students: legacyStudents };
}

async function getLinkedStudentsForAccount(parentAccountId) {
    if (!(await parentAccountsTableExists()) || !parentAccountId) return [];
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
            c.class_name,
            d.division_name,
            s.school_name,
            s.logo AS school_logo
        FROM parent_student_links psl
        JOIN student_forms sf ON sf.id = psl.student_form_id
        LEFT JOIN classes c ON sf.class_id = c.id
        LEFT JOIN divisions d ON sf.division_id = d.id
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
    return Boolean(row);
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
};