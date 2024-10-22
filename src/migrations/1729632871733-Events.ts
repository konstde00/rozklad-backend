import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';

export class CreateEventsTable1729632871733 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = join(__dirname, 'sql', 'events.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = join(__dirname, 'sql', 'events.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await queryRunner.query(sql);
  }
}
