const crypto = require("crypto");

function timingSafeEqualStr(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Middleware to protect sensitive administrative and diagnostic endpoints.
 * Requires ADMIN_SECRET to be configured in environment variables.
 * Never falls back to a hardcoded default key.
 */
module.exports = function adminAuth(req, res, next) {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || !adminSecret.trim()) {
    return res.status(503).json({
      success: false,
      message: "Admin functionality is not configured on this server (ADMIN_SECRET is not set)",
    });
  }

  const providedKey =
    req.headers["x-admin-key"] ||
    req.query?.admin_key ||
    req.body?.admin_key;

  if (!providedKey || !timingSafeEqualStr(String(providedKey).trim(), adminSecret.trim())) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Invalid or missing admin key",
    });
  }

  next();
};
