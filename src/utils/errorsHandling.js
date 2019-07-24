// @flow

// Class that implements an Api Error.
//
class ApiError extends Error {

  httpStatus: number;
  message: string;

  constructor(status: number, msg: string) {
    super(msg);
    this.httpStatus = status;
    this.message = msg;
  }

  getPublicErrorData() {
    return {
      message: this.message,
    };
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
    return new ApiError(403, msg);
  }

  invalidParameter(message: ?string) {
    const msg = message || 'Some of the provided parameters are invalid.';
    return new ApiError(400, msg);
  }

  missingHeader (headerName: string): ApiError {
    const msg = `Missing expected header "${headerName}".`;
    return new ApiError(400, msg);
  }

}

module.exports.factory = new ErrorsFactory();
module.exports.ApiError = ApiError;
