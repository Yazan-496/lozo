import { ErrorResponse, ErrorCode } from '../../shared/types/error.types';

const ERROR_NAME_MAP: Record<string, { code: ErrorCode; statusCode: number }> = {
  ValidationError:  { code: 'VALIDATION_ERROR',    statusCode: 400 },
  NotFoundError:    { code: 'NOT_FOUND',            statusCode: 404 },
  UnauthorizedError:{ code: 'UNAUTHORIZED',         statusCode: 401 },
  ForbiddenError:   { code: 'FORBIDDEN',            statusCode: 403 },
  RateLimitError:   { code: 'RATE_LIMIT_EXCEEDED',  statusCode: 429 },
};

/** Converts any error into a safe, client-facing ErrorResponse — no stack traces. */
export function formatError(error: any, requestId: string): ErrorResponse {
  const mapped = ERROR_NAME_MAP[error?.name];
  const code: ErrorCode = mapped?.code ?? 'INTERNAL_ERROR';
  const statusCode: number = mapped?.statusCode ?? error?.statusCode ?? 500;
  const message: string =
    statusCode < 500
      ? error.message || 'Request failed'
      : 'An unexpected error occurred'; // never leak internals for 5xx

  return {
    error: {
      code,
      message,
      statusCode,
      details: error?.details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}
