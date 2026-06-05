// Lightweight HTTP error with a status code and optional details.
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
}

// Wrap async route handlers so thrown errors reach the error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
