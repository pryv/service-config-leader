/**
 * @extends Error
 */
class ApiError extends Error {
  /**
   * @type {number}
   */
  httpStatus;

  /**
   * @param {number} status
   * @param {string} msg
   */
  constructor(status, msg) {
    super(msg);
    this.httpStatus = status;
  }
}

class ErrorsFactory {
  /**
   * @static
   * @param {Error} error
   * @returns {ApiError}
   */
  static unexpectedError(error) {
    const msg = error.message || 'Unexpected error.';
    return new ApiError(500, msg);
  }

  /**
   * @static
   * @param {string | null} message
   * @returns {ApiError}
   */
  static unauthorized(message) {
    const msg = message || 'Operation is not authorized.';
    return new ApiError(401, msg);
  }

  /**
   * @static
   * @param {string | null} message
   * @returns {ApiError}
   */
  static invalidInput(message) {
    const msg = message || 'Invalid input';
    return new ApiError(400, msg);
  }

  /**
   * @static
   * @param {string} headerName
   * @returns {ApiError}
   */
  static missingHeader(headerName) {
    const msg = `Missing expected header "${headerName}".`;
    return new ApiError(400, msg);
  }

  /**
   * @static
   * @param {string | null} message
   * @returns {ApiError}
   */
  static notFound(message) {
    const msg = message || 'Resource not found.';
    return new ApiError(404, msg);
  }
}

module.exports.factory = ErrorsFactory;
module.exports.ApiError = ApiError;
