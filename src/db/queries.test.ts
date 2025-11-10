import { describe, expect, it } from 'bun:test'
import { insertUser } from './queries';
import { getDb } from './db';
import { createTestDb } from '../test/test-db';


describe('insertUser', () => {
    it('should insert a user and return the user id', async () => {
        const db = createTestDb();
        const email = 'j@gmail.com';
        const username = 'john_doe';
        const password = 'securepassword';
        const userId = await insertUser(db, email, username, password);
        console.log(userId)
        expect(userId).toBeDefined();
    })
});