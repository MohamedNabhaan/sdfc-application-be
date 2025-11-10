import { Database } from 'bun:sqlite';

export const createTestDb = (): Database => {
    const db = new Database(':memory:');
            db.exec('PRAGMA journal_mode = WAL;');
            applySchema(db);
            return db;
}

export const applySchema = (dbInstance: Database) => {
    dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
        );`)
}