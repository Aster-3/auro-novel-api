import { AppError } from "./app.error.js";

export class ConflictError extends AppError {
  conflictField: string;
  statusCode = 409;
  constructor(conflictField: string, message: string) {
    super(message);
    this.conflictField = conflictField;
  }

  serialize() {
    return {
      success: false,
      message: this.message,
      field: this.conflictField,
      statusCode: this.statusCode,
    };
  }
}
