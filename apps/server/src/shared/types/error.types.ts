export interface ErrorResponse {
  error: ErrorDetail;
}

export interface ErrorDetail {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: ErrorDetailItem[];
  timestamp: string;
  requestId: string;
}

export interface ErrorDetailItem {
  field: string;
  message: string;
  value?: any;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';
