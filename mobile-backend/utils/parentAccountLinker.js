const bcrypt = require("bcryptjs");
const { QueryTypes } = require("sequelize");
const sequelize = require("../config/db");

let parentAccountsReady = null;

function normalizePhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length < 10) return null;
    return digits.slice(-10);
}

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

async function hashPasswordIfNeeded(password) {
    if (!password) return null;
    if (String(password).startsWith("$2")) return password;
    return bcrypt.hash(String(password), 10);
}

function phoneSqlExpr(column) {
    return `RIGHT(REGEXP_REPLACE(COALESCE(${column}, ''), '[^0-9]', '', 'g'), 10)`;
}

async function linkStudentToParentAccount(student, transaction = null) {
    if (!(await parentAccountsTableExists())) return null;
    if (!student?.id) return null;

    const email = student.father_email ? normalizeEmail(student.father_email) : null;
    const phone = normalizePhone(student.father_phone || student.mother_phone);

    if (!email && !phone) return null;

    const queryOpts = transaction ? { transaction } : {};

    let existingAccount = null;
    if (phone) {
        const [row] = await sequelize.query(
            `SELECT id FROM parent_accounts WHERE ${phoneSqlExpr("phone")} = :phone LIMIT 1`,
            { replacements: { phone }, type: QueryTypes.SELECT, ...queryOpts }
        );
        existingAccount = row;
    }
    if (!existingAccount && email) {
        const [row] = await sequelize.query(
            `SELECT id FROM parent_accounts WHERE LOWER(email) = :email LIMIT 1`,
            { replacements: { email }, type: QueryTypes.SELECT, ...queryOpts }
        );
        existingAccount = row;
    }

    let parentAccountId = existingAccount?.id;

    if (!parentAccountId) {
        const hashed = await hashPasswordIfNeeded(student.password);
        const [inserted] = await sequelize.query(
            `
            INSERT INTO parent_accounts (email, password, name, phone, created_at, updated_at)
            VALUES (:email, :password, :name, :phone, NOW(), NOW())
            RETURNING id
            `,
            {
                replacements: {
                    email,
                    password: hashed,
                    name: student.father_name || student.mother_name || null,
                    phone: phone || null,
                },
                type: QueryTypes.INSERT,
                ...queryOpts,
            },
        );
        parentAccountId = inserted[0]?.id;
    } else if (phone) {
        await sequelize.query(
            `UPDATE parent_accounts SET phone = :phone, updated_at = NOW() WHERE id = :id AND (phone IS NULL OR phone = '')`,
            { replacements: { phone, id: parentAccountId }, type: QueryTypes.UPDATE, ...queryOpts }
        );
    }

    if (!parentAccountId) return null;

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
            ...queryOpts,
        },
    );

    return parentAccountId;
}

async function linkStudentById(studentFormId, transaction = null) {
    const queryOpts = transaction ? { transaction } : {};
    const [student] = await sequelize.query(
        `SELECT * FROM student_forms WHERE id = :id LIMIT 1`,
        {
            replacements: { id: studentFormId },
            type: QueryTypes.SELECT,
            ...queryOpts,
        },
    );
    if (!student) return null;
    return linkStudentToParentAccount(student, transaction);
}

module.exports = {
    parentAccountsTableExists,
    linkStudentToParentAccount,
    linkStudentById,
};