-- 008 — the reference data the app ships with. The admin edits it afterwards;
-- these are only the starting values, matching what the prototype shows today.

insert into subjects (code, name_ar, color, sort_order) values
  ('math',     'الرياضيات',        '#14717A', 1),
  ('english',  'اللغة الإنجليزية', '#D7A24B', 2),
  ('arabic',   'اللغة العربية',    '#7C6BA8', 3),
  ('physics',  'الفيزياء',         '#C9704F', 4),
  ('chemistry','الكيمياء',         '#4F8FA8', 5),
  ('science',  'العلوم',           '#3F9A6A', 6),
  ('french',   'اللغة الفرنسية',   '#B85C6E', 7),
  ('computer', 'الحاسوب والبرمجة', '#5B7DB1', 8)
on conflict (code) do nothing;

insert into grades (code, name_ar, stage, sort_order) values
  ('kg',  'رياض الأطفال',        'تمهيدي', 1),
  ('g1',  'الصف الأول',          'ابتدائي', 2),
  ('g2',  'الصف الثاني',         'ابتدائي', 3),
  ('g3',  'الصف الثالث',         'ابتدائي', 4),
  ('g4',  'الصف الرابع',         'ابتدائي', 5),
  ('g5',  'الصف الخامس',         'ابتدائي', 6),
  ('g6',  'الصف السادس',         'ابتدائي', 7),
  ('g7',  'الصف السابع',         'إعدادي', 8),
  ('g8',  'الصف الثامن',         'إعدادي', 9),
  ('g9',  'الصف التاسع',         'إعدادي', 10),
  ('g10', 'الصف الأول الثانوي',  'ثانوي', 11),
  ('g11', 'الصف الثاني الثانوي', 'ثانوي', 12),
  ('g12', 'الصف الثالث الثانوي', 'ثانوي', 13),
  ('uni', 'المستوى الجامعي',     'جامعي', 14)
on conflict (code) do nothing;

insert into languages (code, name_ar) values
  ('ar', 'العربية'), ('en', 'الإنجليزية'), ('fr', 'الفرنسية')
on conflict (code) do nothing;

insert into cities (code, name_ar) values
  ('tripoli',  'طرابلس'),
  ('benghazi', 'بنغازي'),
  ('misrata',  'مصراتة'),
  ('zawiya',   'الزاوية'),
  ('sabha',    'سبها'),
  ('bayda',    'البيضاء')
on conflict (code) do nothing;
