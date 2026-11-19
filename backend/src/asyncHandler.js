// Express 4 doesn't catch errors thrown in async handlers.
// Wrapping a handler with this forwards errors to the error middleware.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
