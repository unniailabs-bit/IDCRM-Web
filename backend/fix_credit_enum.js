const sequelize = require('./config/db');

async function fixEnum() {
    try {
        console.log("🔄 Starting Enum fix...");

        await sequelize.authenticate();
        console.log("✅ DB Connected");

        // Add 'deduct' to the enum type
        // Note: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block in some Postgres versions,
        // but sequelize.query usually runs it fine if not wrapped.
        await sequelize.query("ALTER TYPE enum_trust_credit_transactions_type ADD VALUE IF NOT EXISTS 'deduct';");
        console.log("✅ 'deduct' added to enum_trust_credit_transactions_type");

        console.log("🎉 Enum fix completed successfully!");
        process.exit(0);
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log("ℹ️ 'deduct' already exists in enum.");
            process.exit(0);
        }
        console.error("❌ Enum fix failed:", error);
        process.exit(1);
    }
}

fixEnum();
