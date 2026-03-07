import { AppError } from "./app.error.js";

interface ValidationErrorDetail {
  field: string;
  errors: string[];
}

export class ValidationError extends AppError {
  details: ValidationErrorDetail[];
  statusCode = 400;

  constructor(details: ValidationErrorDetail[]) {
    const autoMessage = `Validation failed for: ${details.map((d) => d.field).join(", ")}`;

    super(autoMessage);
    this.name = "ValidationError";
    this.details = details;
  }

  serialize() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}
