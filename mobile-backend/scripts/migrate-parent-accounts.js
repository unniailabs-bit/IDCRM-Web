/**
 * One-time migration: create parent_accounts + links from existing student_forms.
 * Run from mobile-backend: node scripts/migrate-parent-accounts.js
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { QueryTypes } = require("sequelize");
const sequelize = require("../config/db");

async function run() {
    const sqlPath = path.join(
        __dirname,
        "../../backend/migrations/create-parent-accounts.sql",
    );
    const ddl = fs.readFileSync(sqlPath, "utf8");
    await sequelize.query(ddl);

    const students = await sequelize.query(
        `
        SELECT id, father_email, father_name, father_phone, password
        FROM student_forms
        WHERE father_email IS NOT NULL
            AND TRIM(father_email) <> ''
        ORDER BY id ASC
        `,
        { type: QueryTypes.SELECT },
    );

    const byEmail = new Map();
    for (const row of students) {
        const email = row.father_email.trim().toLowerCase();
        if (!byEmail.has(email)) byEmail.set(email, []);
        byEmail.get(email).push(row);
    }

    let accountsCreated = 0;
    let linksCreated = 0;

    for (const [email, rows] of byEmail.entries()) {
        const [existing] = await sequelize.query(
            `SELECT id FROM parent_accounts WHERE LOWER(email) = :email LIMIT 1`,
            { replacements: { email }, type: QueryTypes.SELECT },
        );

        let parentAccountId = existing?.id;
        if (!parentAccountId) {
            const passwordRow = rows.find((r) => r.password) || rows[0];
            let password = passwordRow.password;
            if (password && !String(password).startsWith("$2")) {
                password = await bcrypt.hash(String(password), 10);
            }

            const [inserted] = await sequelize.query(
                `
                INSERT INTO parent_accounts (email, password, name, phone, created_at, updated_at)
                VALUES (:email, :password, :name, :phone, NOW(), NOW())
                RETURNING id
                `,
                {
                    replacements: {
                        email,
                        password: password || null,
                        name: rows[0].father_name || null,
                        phone: rows[0].father_phone || null,
                    },
                    type: QueryTypes.INSERT,
                },
            );
            parentAccountId = inserted[0].id;
            accountsCreated++;
        }

        for (const row of rows) {
            await sequelize.query(
                `
                INSERT INTO parent_student_links (parent_account_id, student_form_id, relationship, is_primary)
                VALUES (:parent_account_id, :student_form_id, 'father', :is_primary)
                ON CONFLICT (parent_account_id, student_form_id) DO NOTHING
                `,
                {
                    replacements: {
                        parent_account_id: parentAccountId,
                        student_form_id: row.id,
                        is_primary: row.id === rows[0].id,
                    },
                    type: QueryTypes.INSERT,
                },
            );
            linksCreated++;
        }
    }

    console.log(
        JSON.stringify(
            {
                success: true,
                accountsCreated,
                linksCreated,
                distinctEmails: byEmail.size,
            },
            null,
            2,
        ),
    );
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});