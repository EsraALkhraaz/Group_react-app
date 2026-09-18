// Reference data — in production this is managed from the admin panel, not hardcoded.

export const SUBJECTS = [
  { id: 'math', name: 'الرياضيات', color: '#5FB79C' },
  { id: 'english', name: 'اللغة الإنجليزية', color: '#EFA24B' },
  { id: 'arabic', name: 'اللغة العربية', color: '#7E8FE0' },
  { id: 'physics', name: 'الفيزياء', color: '#E5896F' },
  { id: 'chemistry', name: 'الكيمياء', color: '#C58BD6' },
  { id: 'science', name: 'العلوم', color: '#6FB1E8' },
  { id: 'french', name: 'اللغة الفرنسية', color: '#EB7A70' },
  { id: 'computer', name: 'الحاسوب والبرمجة', color: '#4E9AD8' },
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
