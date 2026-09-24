-- Parent account identity (one login per guardian email)
CREATE TABLE IF NOT EXISTS parent_accounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(50),
    otp VARCHAR(10),
    otp_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_accounts_email_lower
    ON parent_accounts (LOWER(email));

-- Links one parent account to one or more student profiles
CREATE TABLE IF NOT EXISTS parent_student_links (
    id SERIAL PRIMARY KEY,
    parent_account_id INTEGER NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
    student_form_id INTEGER NOT NULL,
    relationship VARCHAR(50) DEFAULT 'father',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (parent_account_id, student_form_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_student_links_student
    ON parent_student_links (student_form_id);

CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent
    ON parent_student_links (parent_account_id);