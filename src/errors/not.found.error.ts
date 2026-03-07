import { AppError } from "./app.error.js";

export class NotFoundError extends AppError {
  statusCode = 404;
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
