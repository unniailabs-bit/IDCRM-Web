// ------------------- Strict Login Rate Limiter -------------------
// Rate limiting disabled by user request
const loginLimiter = (req, res, next) => next();

// ------------------- Public API Rate Limiter -------------------
// Rate limiting disabled by user request
const publicApiLimiter = (req, res, next) => next();

// ------------------- General API Rate Limiter -------------------
// Rate limiting disabled by user request
const generalApiLimiter = (req, res, next) => next();

module.exports = {
    loginLimiter,
    publicApiLimiter,
    generalApiLimiter,
};
