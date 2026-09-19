export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
}

export function successResponse<T>(
  message: string,
  data: T,
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(message: string, code: string): ErrorResponse {
  return {
    success: false,
    message,
    error: code,
  };
}