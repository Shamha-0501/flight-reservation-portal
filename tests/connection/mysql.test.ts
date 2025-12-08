// tests/mysql.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ddl, dml, raw } from '@/forge/pool/mysql'; // adjust path if needed
import type { RowDataPacket } from 'mysql2';

// Row type for test table
interface TestUserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
}

const TABLE_NAME = 'test_users_vitest';

describe('MySQL helpers: ddl, dml, raw', () => {
  // Clean test table before/after

  beforeAll(async () => {
    // Ensure the table is dropped & created fresh
    await ddl.exec(`DROP TABLE IF EXISTS \`${TABLE_NAME}\``);

    await ddl.exec(`
      CREATE TABLE \`${TABLE_NAME}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  });

  afterAll(async () => {
    // Remove test table at the end
    await ddl.exec(`DROP TABLE IF EXISTS \`${TABLE_NAME}\``);
  });

  it('DDL: creates the test table', async () => {
    const rows = await dml.select<RowDataPacket[]>(
      `SHOW TABLES LIKE ?`,
      [TABLE_NAME]
    );

    expect(rows.length).toBe(1);
  });

  it('DML: insert/select/update/delete works', async () => {
    // INSERT
    const insertResult = await dml.insert(
      `INSERT INTO \`${TABLE_NAME}\` (name, email) VALUES (?, ?)`,
      ['Alice', 'alice@example.com']
    );

    expect(insertResult.affectedRows).toBe(1);
    expect(insertResult.insertId).toBeGreaterThan(0);

    const insertedId = insertResult.insertId;

    // SELECT
    const users = await dml.select<TestUserRow[]>(
      `SELECT id, name, email FROM \`${TABLE_NAME}\` WHERE id = ?`,
      [insertedId]
    );

    expect(users.length).toBe(1);
    expect(users[0].name).toBe('Alice');
    expect(users[0].email).toBe('alice@example.com');

    // UPDATE
    const updateResult = await dml.update(
      `UPDATE \`${TABLE_NAME}\` SET name = ? WHERE id = ?`,
      ['Alice Updated', insertedId]
    );

    expect(updateResult.affectedRows).toBe(1);

    const updatedUsers = await dml.select<TestUserRow[]>(
      `SELECT id, name, email FROM \`${TABLE_NAME}\` WHERE id = ?`,
      [insertedId]
    );

    expect(updatedUsers[0].name).toBe('Alice Updated');

    // DELETE
    const deleteResult = await dml.remove(
      `DELETE FROM \`${TABLE_NAME}\` WHERE id = ?`,
      [insertedId]
    );

    expect(deleteResult.affectedRows).toBe(1);

    const afterDelete = await dml.select<TestUserRow[]>(
      `SELECT id FROM \`${TABLE_NAME}\` WHERE id = ?`,
      [insertedId]
    );

    expect(afterDelete.length).toBe(0);
  });

  it('RAW: can run custom queries and aggregate', async () => {
    // Seed some data
    await dml.insert(
      `INSERT INTO \`${TABLE_NAME}\` (name, email) VALUES (?, ?)`,
      ['Bob', 'bob@example.com']
    );
    await dml.insert(
      `INSERT INTO \`${TABLE_NAME}\` (name, email) VALUES (?, ?)`,
      ['Charlie', 'charlie@example.com']
    );

    // Raw query
    const rows = await raw.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM \`${TABLE_NAME}\``
    );

    expect(rows.length).toBe(1);
    expect(rows[0].total).toBeGreaterThanOrEqual(2);
  });
});
