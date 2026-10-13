import { ERROR_MESSAGES } from '../constants/AppConstants';

export class ErrorUtils {
  static handleError(error: unknown, context = '') {
    console.error(`Error in ${context}:`, error);

    return {
      message: this.getErrorMessage(error),
      context,
      timestamp: Date.now(),
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  static getErrorMessage(error: unknown) {
    if (!error) {
      return ERROR_MESSAGES.unknownError;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'object' && error && 'message' in error) {
      return String((error as { message: unknown }).message);
    }

    return ERROR_MESSAGES.unknownError;
  }

  static createError(message: string, code: string | null = null, details: unknown = null) {
    const error = new Error(message) as Error & { code?: string | null; details?: unknown };
    if (code) error.code = code;
    if (details) error.details = details;
    return error;
  }

  static createUserFriendlyMessage(error: unknown) {
    return this.getErrorMessage(error) || ERROR_MESSAGES.unknownError;
  }
}
