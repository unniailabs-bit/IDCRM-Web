const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Path to the service account key file
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "serviceAccountKey.json");

if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  try {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("❌ Firebase initialization error:", error.message);
  }
} else {
  console.warn("⚠️ Firebase serviceAccountKey.json not found. Push notifications will be disabled.");
}

module.exports = admin;
