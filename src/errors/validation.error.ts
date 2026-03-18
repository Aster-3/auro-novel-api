import { AppError } from "./app.error.js";

// Yeni tip tanımı: Anahtar alan adı, değer ise hata mesajları dizisi
interface ValidationErrorDetails {
  errors: Record<string, string[]>;
}

export class ValidationError extends AppError {
  details: ValidationErrorDetails;
  statusCode = 422;

  constructor(details: ValidationErrorDetails) {
    // Mesaj kısmında tüm hatalı alanları virgülle ayırarak gösteriyoruz
    const fieldNames = Object.keys(details.errors).join(", ");
    const autoMessage = `Validation failed for: ${fieldNames}`;

    super(autoMessage);
    this.name = "ValidationError";
    this.details = details;
  }

  serialize() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      // Burada direkt details'i dönüyoruz, içinde zaten "errors" objesi var
      errors: this.details.errors,
    };
  }
}
