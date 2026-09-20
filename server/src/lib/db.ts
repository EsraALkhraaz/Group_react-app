import pg from 'pg';
import { config } from '../config.ts';

// Money arrives as numeric; node-postgres hands it over as a string so no
// precision is lost on the way. Parsing it to a float here would undo the whole
// point of using numeric in the first place.
pg.types.setTypeParser(1700, (value) => value);

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export const query = async <T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> => {
  const result = await pool.query<T>(text, params);
  return result.rows;
};

export const one = async <T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> => {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
};

// Anything that touches more than one table runs inside a transaction, so a
// failure halfway cannot leave the ledger half-written.
export const transaction = async <T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const out = await fn(client);
    await client.query('commit');
    return out;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};
