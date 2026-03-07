import { AppError } from "./app.error.js";

export class ForbiddenError extends AppError {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }

  serialize() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
