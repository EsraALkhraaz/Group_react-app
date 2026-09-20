import { z } from 'zod';

// The same rules the prototype enforces in its forms, restated where they
// actually count. The client may check them too, but only this side decides.
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, '').replace(/^(\+?218)/, '0'))
  .refine((value) => /^09\d{8}$/.test(value), 'أدخل رقم هاتف ليبي صحيح يبدأ بـ09');

export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور 8 أحرف على الأقل')
  .refine((value) => /[A-Za-z؀-ۿ]/.test(value) && /\d/.test(value),
    'كلمة المرور يجب أن تجمع بين حروف وأرقام');

export const roleSchema = z.enum(['student', 'parent', 'teacher', 'admin']);

// Nobody signs themselves up as the platform's admin.
export const signupRoleSchema = z.enum(['student', 'parent', 'teacher']);

export const codeSchema = z.string().trim().regex(/^\d{4}$/, 'الرمز أربعة أرقام');
