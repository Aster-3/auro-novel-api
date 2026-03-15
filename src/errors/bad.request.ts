import { AppError } from "./app.error.js";

export class BadRequestError extends AppError {
  statusCode = 400;
  constructor(message: string) {
    super(message);
  }

  serialize() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
