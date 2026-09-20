// One error shape for the whole API: a status, a stable code the client can
// branch on, and an Arabic message it can show as-is.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (code: string, message: string) => new ApiError(400, code, message);
export const unauthorized = (message = 'يلزم تسجيل الدخول') => new ApiError(401, 'unauthorized', message);
export const forbidden = (message = 'لا تملك صلاحية هذا الإجراء') => new ApiError(403, 'forbidden', message);
export const notFound = (message = 'غير موجود') => new ApiError(404, 'not_found', message);
export const tooMany = (message: string) => new ApiError(429, 'too_many_requests', message);
