// @flow

// Class that implements an Api Error.
//
class ApiError extends Error {

  httpStatus: number;

  constructor(status: number, msg: string) {
    super(msg);
    this.httpStatus = status;
  }
}

// Factory class that allows to generate Api Error.
//
class ErrorsFactory {

  unexpectedError(error: Error) {
    const msg = error.message || 'Unexpected error.';
    return new ApiError(500, msg);
  }

  unauthorized(message: ?string) {
    const msg = message || 'Operation is not authorized.';
    return new ApiError(401, msg);
  }

  invalidInput(message: ?string) {
    const msg = message || 'Invalid input';
    return new ApiError(400, msg);
  }

  missingHeader (headerName: string): ApiError {
    const msg = `Missing expected header "${headerName}".`;
    return new ApiError(400, msg);
  }

  notFound (message: ?string): ApiError {
    const msg = message || 'Resource not found.';
    return new ApiError(404, msg);
  }

}

module.exports.factory = new ErrorsFactory();
module.exports.ApiError = ApiError;
