import { AppError } from "./app.error.js";

export class UnauthenticatedError extends AppError {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = "UnauthenticatedError";
  }

  serialize() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
