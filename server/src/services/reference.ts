import { query, one } from '../lib/db.ts';
import { badRequest, notFound } from '../lib/errors.ts';

// The four lists the admin owns. Named explicitly so a caller can never inject
// a table name through the URL.
const TABLES = {
  subjects:  { table: 'subjects',  extra: 'color, sort_order' },
  grades:    { table: 'grades',    extra: 'stage, sort_order' },
  languages: { table: 'languages', extra: null },
  cities:    { table: 'cities',    extra: null },
} as const;

export type ReferenceKind = keyof typeof TABLES;

export const isReferenceKind = (value: string): value is ReferenceKind => value in TABLES;

const columns = (kind: ReferenceKind): string => {
  const { extra } = TABLES[kind];
  return `id, code, name_ar as "name"${extra ? `, ${extra.split(', ').map((c) => (c === 'sort_order' ? 'sort_order as "sortOrder"' : c)).join(', ')}` : ''}, (disabled_at is not null) as disabled`;
};

const order = (kind: ReferenceKind): string =>
  (TABLES[kind].extra?.includes('sort_order') ? 'sort_order, name_ar' : 'name_ar');

export const list = (kind: ReferenceKind, includeDisabled = false) =>
  query(
    `select ${columns(kind)} from ${TABLES[kind].table}
     ${includeDisabled ? '' : 'where disabled_at is null'}
     order by ${order(kind)}`,
  );

export const listAll = async (includeDisabled = false) => ({
  subjects:  await list('subjects', includeDisabled),
  grades:    await list('grades', includeDisabled),
  languages: await list('languages', includeDisabled),
  cities:    await list('cities', includeDisabled),
});

export const create = async (kind: ReferenceKind, input: {
  code: string; name: string; color?: string; stage?: string;
}) => {
  const exists = await one(`select 1 from ${TABLES[kind].table} where code = $1`, [input.code]);
  if (exists) throw badRequest('code_taken', 'هذا الرمز مستخدم بالفعل');

  const extras = TABLES[kind].extra;
  if (kind === 'subjects') {
    return one(
      `insert into subjects (code, name_ar, color) values ($1,$2,$3) returning ${columns(kind)}`,
      [input.code, input.name, input.color ?? '#5B7DB1'],
    );
  }
  if (kind === 'grades') {
    return one(
      `insert into grades (code, name_ar, stage) values ($1,$2,$3) returning ${columns(kind)}`,
      [input.code, input.name, input.stage ?? null],
    );
  }
  void extras;
  return one(
    `insert into ${TABLES[kind].table} (code, name_ar) values ($1,$2) returning ${columns(kind)}`,
    [input.code, input.name],
  );
};

export const rename = async (kind: ReferenceKind, id: string, input: {
  name?: string; color?: string; stage?: string;
}) => {
  const row = await one(`select 1 from ${TABLES[kind].table} where id = $1`, [id]);
  if (!row) throw notFound('العنصر غير موجود');

  if (kind === 'subjects') {
    return one(
      `update subjects set name_ar = coalesce($2, name_ar), color = coalesce($3, color)
       where id = $1 returning ${columns(kind)}`,
      [id, input.name ?? null, input.color ?? null],
    );
  }
  if (kind === 'grades') {
    return one(
      `update grades set name_ar = coalesce($2, name_ar), stage = coalesce($3, stage)
       where id = $1 returning ${columns(kind)}`,
      [id, input.name ?? null, input.stage ?? null],
    );
  }
  return one(
    `update ${TABLES[kind].table} set name_ar = coalesce($2, name_ar)
     where id = $1 returning ${columns(kind)}`,
    [id, input.name ?? null],
  );
};

// Nothing is deleted: a booking that points at a retired subject still has to
// be able to name it. Retiring only hides it from the pickers.
export const setDisabled = async (kind: ReferenceKind, id: string, disabled: boolean) => {
  const row = await one(
    `update ${TABLES[kind].table} set disabled_at = ${disabled ? 'now()' : 'null'}
     where id = $1 returning ${columns(kind)}`,
    [id],
  );
  if (!row) throw notFound('العنصر غير موجود');
  return row;
};
