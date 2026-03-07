export abstract class AppError extends Error {
  public isOperational: boolean;
  abstract statusCode: number;
  constructor(public message: string) {
    super(message);
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  abstract serialize(): {
    success: boolean;
    message: string;
    statusCode: number;
    [key: string]: any;
  };
}
