import { AppError } from "./app.error.js";

export class AdultContentConfirmationRequiredError extends AppError {
  statusCode = 428;

  constructor() {
    super(
      "Yetiskin icerikleri acmak icin 18 yasinda veya daha buyuk oldugunuzu onaylamalisiniz.",
    );
  }

  serialize() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      code: "ADULT_CONTENT_CONFIRMATION_REQUIRED",
    };
  }
}
