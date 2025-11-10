import {Database} from 'bun:sqlite'
import { Data } from 'hono/dist/types/context'
import { join} from 'path'

const dbPath = join('.','db.sqlite')


let db: Database

export const getDb = () => {
    if (!db) {
        db = new Database(dbPath)
        db.exec('PRAGMA journal_mode = WAL;');
        applySchema(db);
    }
    return db
}

export const applySchema = (dbInstance: Database) => {
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loanNumber TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        interestRate REAL DEFAULT 0,
        amount REAL NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        overdueAmount REAL DEFAULT 0,
        emi REAL NOT NULL,
        outstandingBalance REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, loanNumber) -- ensures no duplicate per user
        );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      paymentNo TEXT UNIQUE NOT NULL,
      paymentDate TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
    );
  `);
};