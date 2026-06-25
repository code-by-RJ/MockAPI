// Runs before each test file's own imports (Jest setupFiles timing).
// Sets these BEFORE app.js's internal dotenv.config() runs — dotenv never
// overwrites already-set process.env values, so these stick for all tests.
process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-prod'
process.env.NODE_ENV   = 'test'