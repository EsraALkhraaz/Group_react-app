// Reference data — in production this is managed from the admin panel, not hardcoded.

// Subject colors sit in the brand's family: teal and gold lead, the rest
// are mid-saturation neighbours so a grid of cards still reads as one system.
export const SUBJECTS = [
  { id: 'math', name: 'الرياضيات', color: '#14717A' },
  { id: 'english', name: 'اللغة الإنجليزية', color: '#D7A24B' },
  { id: 'arabic', name: 'اللغة العربية', color: '#7C6BA8' },
  { id: 'physics', name: 'الفيزياء', color: '#C9704F' },
  { id: 'chemistry', name: 'الكيمياء', color: '#4F8FA8' },
  { id: 'science', name: 'العلوم', color: '#3F9A6A' },
  { id: 'french', name: 'اللغة الفرنسية', color: '#B85C6E' },
  { id: 'computer', name: 'الحاسوب والبرمجة', color: '#5B7DB1' },
];

export const GRADES = [
  { id: 'kg', name: 'رياض الأطفال', stage: 'تمهيدي' },
  { id: 'g1', name: 'الصف الأول', stage: 'ابتدائي' },
  { id: 'g2', name: 'الصف الثاني', stage: 'ابتدائي' },
  { id: 'g3', name: 'الصف الثالث', stage: 'ابتدائي' },
  { id: 'g4', name: 'الصف الرابع', stage: 'ابتدائي' },
  { id: 'g5', name: 'الصف الخامس', stage: 'ابتدائي' },
  { id: 'g6', name: 'الصف السادس', stage: 'ابتدائي' },
  { id: 'g7', name: 'الصف السابع', stage: 'إعدادي' },
  { id: 'g8', name: 'الصف الثامن', stage: 'إعدادي' },
  { id: 'g9', name: 'الصف التاسع', stage: 'إعدادي' },
  { id: 'g10', name: 'الصف الأول الثانوي', stage: 'ثانوي' },
  { id: 'g11', name: 'الصف الثاني الثانوي', stage: 'ثانوي' },
  { id: 'g12', name: 'الصف الثالث الثانوي', stage: 'ثانوي' },
  { id: 'uni', name: 'المستوى الجامعي', stage: 'جامعي' },
];

export const LANGUAGES = [
  { id: 'ar', name: 'العربية' },
  { id: 'en', name: 'الإنجليزية' },
  { id: 'fr', name: 'الفرنسية' },
];

export const CITIES = [
  { id: 'tripoli', name: 'طرابلس' },
  { id: 'benghazi', name: 'بنغازي' },
  { id: 'misrata', name: 'مصراتة' },
  { id: 'zawiya', name: 'الزاوية' },
  { id: 'sabha', name: 'سبها' },
  { id: 'bayda', name: 'البيضاء' },
];

// Hourly rates in LYD suggested to a teacher when they join.
// Every teacher sets their own rates afterwards — these are only a starting point.
export const DEFAULT_RATES = {
  online: { individual: 30, group: 20 },
  f2f: { individual: 50, group: 30 },
};

// Guard rails the admin panel enforces on whatever a teacher enters.
export const RATE_LIMITS = { min: 10, max: 200 };

// Platform commission — configurable from the admin panel, never fixed in product code.
export const COMMISSION_RATE = 0.15;

// Cancellation window in hours — also an admin setting.
export const FREE_CANCELLATION_HOURS = 24;

export const PLATFORM_BANK = {
  bankName: 'مصرف الجمهورية',
  accountName: 'شركة درسي للخدمات التعليمية',
  accountNumber: '0021-4457-8890-1122',
};

export const subjectById = (id) => SUBJECTS.find((s) => s.id === id);
export const gradeById = (id) => GRADES.find((g) => g.id === id);
export const languageById = (id) => LANGUAGES.find((l) => l.id === id);
export const cityById = (id) => CITIES.find((c) => c.id === id);
