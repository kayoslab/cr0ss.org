/**
 * Schema migrations for the Neon database.
 *
 *   pnpm db:migrate status     what is applied, what is pending, what changed
 *   pnpm db:migrate up         apply every pending file in db/migrations, in order
 *   pnpm db:migrate baseline   record every file as applied without running it
 *                              (for a database that predates this ledger)
 *
 * Files are `NNN_name.sql`, applied in filename order, each inside its own
 * transaction, and recorded in `schema_migrations` with a checksum so an
 * edited-after-apply file is reported rather than silently ignored.
 *
 * Reads DATABASE_URL (scripts/load-env.ts loads .env, .env.development.local,
 * .env.local). Point it at a Neon branch to rehearse a migration first.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from '@neondatabase/serverless';

const MIGRATIONS_DIR = join(process.cwd(), 'db/migrations');
const LEDGER = 'schema_migrations';

type Applied = { name: string; checksum: string; applied_at: string };

function listFiles(): Array<{ name: string; sql: string; checksum: string }> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort()
    .map((name) => {
      const sql = readFileSync(join(MIGRATIONS_DIR, name), 'utf8');
      return {
        name,
        sql,
        checksum: createHash('sha256').update(sql).digest('hex'),
      };
    });
}

async function main() {
  const command = process.argv[2] ?? 'status';
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${LEDGER} (
        name TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = listFiles();
    const applied = new Map(
      (
        await pool.query<Applied>(
          `SELECT name, checksum, applied_at FROM ${LEDGER}`
        )
      ).rows.map((r) => [r.name, r])
    );
    const pending = files.filter((f) => !applied.has(f.name));
    const drifted = files.filter(
      (f) => applied.has(f.name) && applied.get(f.name)!.checksum !== f.checksum
    );

    switch (command) {
      case 'status': {
        for (const f of files) {
          const a = applied.get(f.name);
          const state = !a
            ? 'pending'
            : a.checksum === f.checksum
              ? 'applied'
              : 'CHANGED since applied';
          console.log(
            `${state.padEnd(22)} ${f.name}${a ? `  (${a.applied_at})` : ''}`
          );
        }
        console.log(
          `\n${applied.size} applied, ${pending.length} pending, ${drifted.length} changed.`
        );
        if (drifted.length > 0) process.exit(2);
        return;
      }

      case 'baseline': {
        for (const f of pending) {
          await pool.query(
            `INSERT INTO ${LEDGER} (name, checksum) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
            [f.name, f.checksum]
          );
          console.log(`recorded  ${f.name}`);
        }
        console.log(
          `\nBaseline complete: ${pending.length} file(s) recorded as applied.`
        );
        return;
      }

      case 'up': {
        if (drifted.length > 0) {
          console.error(
            `Refusing to migrate: ${drifted.map((f) => f.name).join(', ')} changed after being applied.`
          );
          process.exit(2);
        }
        if (pending.length === 0) {
          console.log('Nothing to apply.');
          return;
        }
        for (const f of pending) {
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            await client.query(f.sql);
            await client.query(
              `INSERT INTO ${LEDGER} (name, checksum) VALUES ($1, $2)`,
              [f.name, f.checksum]
            );
            await client.query('COMMIT');
            console.log(`applied   ${f.name}`);
          } catch (error) {
            await client.query('ROLLBACK');
            console.error(`failed    ${f.name}`);
            throw error;
          } finally {
            client.release();
          }
        }
        console.log(`\nApplied ${pending.length} migration(s).`);
        return;
      }

      default:
        console.error(
          `Unknown command '${command}'. Use: status | up | baseline`
        );
        process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
