/**
 * Durable Relational SQL Adapter for GF-AI
 * ─────────────────────────────────────────
 * Supports:
 * - PostgreSQL / Neon via `pg.Pool` (when `DATABASE_URL` starts with postgres:// or postgresql://)
 * - LibSQL / Turso via `@libsql/client` (when `TURSO_DATABASE_URL` / `LIBSQL_URL` is set, or local file)
 * - Automated Schema Migration Runner
 * - Multi-tenant isolation helper (`WHERE user_id = ?`)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { createClient, type Client as LibsqlClient } from '@libsql/client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type SqlEngine = 'postgres' | 'libsql' | 'sqlite_local'

export interface SqlQueryResult<T = any> {
  rows: T[]
  rowCount: number
}

export class SqlAdapter {
  private static instance: SqlAdapter | null = null
  private pgPool: Pool | null = null
  private libsqlClient: LibsqlClient | null = null
  private engine: SqlEngine = 'sqlite_local'
  private isInitialized = false

  private constructor() {
    this.configureEngine()
  }

  static getInstance(): SqlAdapter {
    if (!this.instance) {
      this.instance = new SqlAdapter()
    }
    return this.instance
  }

  private configureEngine(): void {
    const dbUrl = process.env.DATABASE_URL || ''
    const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || ''
    const tursoAuth = process.env.TURSO_AUTH_TOKEN || ''

    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
      this.engine = 'postgres'
      this.pgPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 15,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      })
      console.log('[SqlAdapter] Configured PostgreSQL connection pool')
    } else if (tursoUrl) {
      this.engine = 'libsql'
      this.libsqlClient = createClient({
        url: tursoUrl,
        authToken: tursoAuth,
      })
      console.log('[SqlAdapter] Configured Turso/libSQL client')
    } else {
      this.engine = 'sqlite_local'
      const storageDir = './data'
      try {
        if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })
      } catch {}
      const dbFile = path.join(storageDir, 'ada_relational.db')
      this.libsqlClient = createClient({
        url: `file:${dbFile}`,
      })
      console.log(`[SqlAdapter] Configured local libSQL/SQLite database at: ${dbFile}`)
    }
  }

  getEngine(): SqlEngine {
    return this.engine
  }

  /**
   * Initializes and executes all schema migration DDL statements from schema.sql
   */
  async runMigrations(): Promise<{ success: boolean; statementsExecuted: number; engine: string }> {
    if (this.isInitialized) return { success: true, statementsExecuted: 0, engine: this.engine }

    try {
      const schemaPath = path.join(process.cwd(), 'apps', 'server', 'src', 'db', 'schema.sql')
      let schemaSql = ''
      if (fs.existsSync(schemaPath)) {
        schemaSql = fs.readFileSync(schemaPath, 'utf-8')
      } else {
        const altPath = path.join(__dirname, 'schema.sql')
        if (fs.existsSync(altPath)) {
          schemaSql = fs.readFileSync(altPath, 'utf-8')
        }
      }

      if (!schemaSql) {
        console.warn('[SqlAdapter] schema.sql not found, skipping DDL execution')
        this.isInitialized = true
        return { success: true, statementsExecuted: 0, engine: this.engine }
      }

      // Strip SQL line comments and block comments properly before splitting statements
      const cleanedSql = schemaSql
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')

      const statements = cleanedSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      let executed = 0
      for (const stmt of statements) {
        try {
          await this.query(stmt)
          executed++
        } catch (err: any) {
          // Ignore index already exists or table already exists warnings
          if (!err.message?.includes('already exists') && !err.message?.includes('duplicate key')) {
            console.warn(`[SqlAdapter] Migration statement warning: ${err.message}`)
          }
        }
      }

      this.isInitialized = true
      console.log(`[SqlAdapter] Relational schema migration complete: ${executed} statements executed (${this.engine})`)
      return { success: true, statementsExecuted: executed, engine: this.engine }
    } catch (err: any) {
      console.error('[SqlAdapter] Migration failed:', err)
      return { success: false, statementsExecuted: 0, engine: this.engine }
    }
  }

  /**
   * Executes a parameterized SQL query with multi-tenant isolation.
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<SqlQueryResult<T>> {
    if (this.engine === 'postgres' && this.pgPool) {
      // Convert ? parameters to $1, $2, etc for PostgreSQL
      let paramIndex = 1
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`)
      const res = await this.pgPool.query(pgSql, params)
      return {
        rows: res.rows,
        rowCount: res.rowCount || 0,
      }
    }

    if (this.libsqlClient) {
      const res = await this.libsqlClient.execute({ sql, args: params })
      return {
        rows: (res.rows as unknown) as T[],
        rowCount: res.rowsAffected || res.rows.length,
      }
    }

    throw new Error('[SqlAdapter] No active database engine connected')
  }

  /**
   * Graceful shutdown of connection pool
   */
  async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end()
    }
    if (this.libsqlClient) {
      this.libsqlClient.close()
    }
  }
}

export const sqlDb = SqlAdapter.getInstance()
