// Libyan mobile numbers: 09X XXXXXXX locally, +218 9X XXXXXXX internationally.
export const normalizePhone = (raw) => {
  const digits = String(raw).replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (digits.startsWith('218')) return `0${digits.slice(3)}`;
  return digits;
};

export const isValidPhone = (raw) => /^09\d{8}$/.test(normalizePhone(raw));

export const PASSWORD_MIN = 8;

export const passwordIssue = (value) => {
  if (!value) return 'أدخل كلمة المرور';
  if (value.length < PASSWORD_MIN) return `كلمة المرور ${PASSWORD_MIN} أحرف على الأقل`;
  if (!/[A-Za-z؀-ۿ]/.test(value) || !/\d/.test(value)) {
    return 'اجمع بين حروف وأرقام';
  }
  return null;
};

export const isValidCode = (code) => /^\d{4}$/.test(String(code));
