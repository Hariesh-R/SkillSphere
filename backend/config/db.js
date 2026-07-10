/**
 * backend/config/db.js
 *
 * Database Abstraction Layer – SkillSphere
 * =========================================
 * This module is the ONLY place in the entire codebase that talks to the
 * underlying database engine.  All other modules call the exported helper
 * functions (run, get, all, transaction, close, healthCheck) and remain
 * completely unaware of which engine is in use.
 *
 * Supported drivers (DB_DRIVER env variable):
 *   • "sqlite"    – active default, powered by better-sqlite3
 *   • "azure-sql" – NOT IMPLEMENTED YET (see Azure placeholder comments below)
 *
 * To migrate to Azure SQL Database in the future:
 *   1. Set  DB_DRIVER=azure-sql  in your environment.
 *   2. Install the "mssql" (tedious) package.
 *   3. Fill in the Azure SQL implementation blocks marked with
 *      "AZURE SQL IMPLEMENTATION" comments below.
 *   4. No other file in the project needs to change.
 */

"use strict";

require("dotenv").config();
const path = require("path");
const fs = require("fs");

// ─────────────────────────────────────────────
// Driver selection
// ─────────────────────────────────────────────
const DB_DRIVER = (process.env.DB_DRIVER || "sqlite").toLowerCase();

// ─────────────────────────────────────────────
// Internal state – holds the active connection
// ─────────────────────────────────────────────
let _db = null; // SQLite Database instance  |  mssql ConnectionPool (Azure)

// ═════════════════════════════════════════════
//  SQLITE IMPLEMENTATION
// ═════════════════════════════════════════════

/**
 * Lazily initialise and return the SQLite connection.
 * The file path comes from SQLITE_FILE (default: ./data/skillsphere.db).
 *
 * @returns {import("better-sqlite3").Database}
 */
function _getSQLiteConnection() {
  if (_db) return _db;

  const dbFile = path.resolve(
    process.env.SQLITE_FILE || "./data/skillsphere.db"
  );

  // Ensure the parent directory exists so SQLite can create the file.
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // better-sqlite3 is synchronous – no connection pooling needed for SQLite.
  // IMPORTANT: No other module should ever import better-sqlite3 directly.
  const Database = require("better-sqlite3");

  _db = new Database(dbFile, {
    // Verbose logging only in development – keep production logs clean.
    verbose: process.env.NODE_ENV === "development" ? console.log : null,
  });

  // Enable WAL mode for better concurrent read performance.
  _db.pragma("journal_mode = WAL");
  // Enforce foreign-key constraints (SQLite disables them by default).
  _db.pragma("foreign_keys = ON");

  console.log(`[DB] SQLite connected → ${dbFile}`);
  return _db;
}

// ─────────────────────────────────────────────
//  AZURE SQL IMPLEMENTATION PLACEHOLDER
// ─────────────────────────────────────────────
// async function _getAzureSQLConnection() {
//   /**
//    * ╔══════════════════════════════════════════════════════════╗
//    * ║  AZURE SQL IMPLEMENTATION – Not implemented yet          ║
//    * ║                                                          ║
//    * ║  When implementing, replace the body of this function    ║
//    * ║  with the mssql ConnectionPool setup below and return    ║
//    * ║  the connected pool as `_db`.                            ║
//    * ║                                                          ║
//    * ║  Required env vars:                                      ║
//    * ║    AZURE_SQL_SERVER   – your-server.database.windows.net ║
//    * ║    AZURE_SQL_DATABASE – database name                    ║
//    * ║    AZURE_SQL_USER     – login username                   ║
//    * ║    AZURE_SQL_PASSWORD – login password                   ║
//    * ╚══════════════════════════════════════════════════════════╝
//    *
//    * const sql = require("mssql");
//    * if (_db) return _db;
//    * const config = {
//    *   server: process.env.AZURE_SQL_SERVER,
//    *   database: process.env.AZURE_SQL_DATABASE,
//    *   user: process.env.AZURE_SQL_USER,
//    *   password: process.env.AZURE_SQL_PASSWORD,
//    *   options: { encrypt: true, trustServerCertificate: false },
//    *   pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
//    * };
//    * _db = await sql.connect(config);
//    * console.log("[DB] Azure SQL connected");
//    * return _db;
//    */
// }

// ═════════════════════════════════════════════
//  PUBLIC API – driver-agnostic helpers
// ═════════════════════════════════════════════

/**
 * Execute a write statement (INSERT / UPDATE / DELETE / CREATE).
 * Uses a prepared statement for safety and performance.
 *
 * @param {string} sql   – Parameterised SQL query.
 * @param {Array}  params – Positional parameters bound to "?" placeholders.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }}
 *
 * ─── AZURE SQL IMPLEMENTATION ───────────────────────────────────────────────
 * Replace the SQLite body with:
 *   const pool = await _getAzureSQLConnection();
 *   const request = pool.request();
 *   params.forEach((p, i) => request.input(`p${i}`, p));
 *   const result = await request.query(sql.replace(/\?/g, (_, k) => `@p${k}`));
 *   return { changes: result.rowsAffected[0], lastInsertRowid: null };
 * ────────────────────────────────────────────────────────────────────────────
 */
function run(sql, params = []) {
  const db = _getSQLiteConnection();
  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
}

/**
 * Fetch a single row. Returns `undefined` when no row matches.
 * Uses a prepared statement for safety and performance.
 *
 * @param {string} sql
 * @param {Array}  params
 * @returns {object|undefined}
 *
 * ─── AZURE SQL IMPLEMENTATION ───────────────────────────────────────────────
 * Replace the SQLite body with:
 *   const pool = await _getAzureSQLConnection();
 *   const request = pool.request();
 *   params.forEach((p, i) => request.input(`p${i}`, p));
 *   const result = await request.query(sql.replace(/\?/g, (_, k) => `@p${k}`));
 *   return result.recordset[0];
 * ────────────────────────────────────────────────────────────────────────────
 */
function get(sql, params = []) {
  const db = _getSQLiteConnection();
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

/**
 * Fetch all matching rows as an array.
 * Uses a prepared statement for safety and performance.
 *
 * @param {string} sql
 * @param {Array}  params
 * @returns {object[]}
 *
 * ─── AZURE SQL IMPLEMENTATION ───────────────────────────────────────────────
 * Replace the SQLite body with:
 *   const pool = await _getAzureSQLConnection();
 *   const request = pool.request();
 *   params.forEach((p, i) => request.input(`p${i}`, p));
 *   const result = await request.query(sql.replace(/\?/g, (_, k) => `@p${k}`));
 *   return result.recordset;
 * ────────────────────────────────────────────────────────────────────────────
 */
function all(sql, params = []) {
  const db = _getSQLiteConnection();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Execute multiple statements atomically inside a database transaction.
 * Rolls back automatically if `fn` throws.
 *
 * @param {function} fn – Callback that receives no arguments; use the other
 *                        helpers (run/get/all) inside it as usual.
 * @returns {*} The return value of `fn`.
 *
 * ─── AZURE SQL IMPLEMENTATION ───────────────────────────────────────────────
 * Replace the SQLite body with:
 *   const pool = await _getAzureSQLConnection();
 *   const transaction = new sql.Transaction(pool);
 *   await transaction.begin();
 *   try {
 *     const result = await fn(transaction);
 *     await transaction.commit();
 *     return result;
 *   } catch (err) {
 *     await transaction.rollback();
 *     throw err;
 *   }
 * ────────────────────────────────────────────────────────────────────────────
 */
function transaction(fn) {
  const db = _getSQLiteConnection();
  // better-sqlite3 transaction() wraps the callback in BEGIN/COMMIT/ROLLBACK.
  const wrapped = db.transaction(fn);
  return wrapped();
}

/**
 * Gracefully close the database connection.
 * Safe to call multiple times.
 *
 * ─── AZURE SQL IMPLEMENTATION ───────────────────────────────────────────────
 * Replace the SQLite body with:
 *   if (_db) { await _db.close(); _db = null; }
 * ────────────────────────────────────────────────────────────────────────────
 */
function close() {
  if (_db) {
    _db.close();
    _db = null;
    console.log("[DB] Connection closed.");
  }
}

/**
 * Verify the database is reachable and accepting queries.
 * Used by health-check endpoints and startup routines.
 *
 * @returns {{ ok: boolean, driver: string, latencyMs: number, error?: string }}
 *
 * ─── AZURE SQL IMPLEMENTATION ───────────────────────────────────────────────
 * Replace the SQLite ping with:
 *   const pool = await _getAzureSQLConnection();
 *   await pool.request().query("SELECT 1 AS ping");
 * ────────────────────────────────────────────────────────────────────────────
 */
function healthCheck() {
  const start = Date.now();
  try {
    const db = _getSQLiteConnection();
    // Simple round-trip ping query.
    db.prepare("SELECT 1 AS ping").get();
    return { ok: true, driver: DB_DRIVER, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      driver: DB_DRIVER,
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

// ─────────────────────────────────────────────
//  Boot-time driver validation
// ─────────────────────────────────────────────
const SUPPORTED_DRIVERS = ["sqlite"]; // add "azure-sql" here once implemented
if (!SUPPORTED_DRIVERS.includes(DB_DRIVER)) {
  throw new Error(
    `[DB] Unsupported DB_DRIVER="${DB_DRIVER}". ` +
      `Supported: ${SUPPORTED_DRIVERS.join(", ")}`
  );
}

module.exports = { run, get, all, transaction, close, healthCheck };
