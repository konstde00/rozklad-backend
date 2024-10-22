import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';

export class CreateGroupSubjectsTable1729632871730 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = join(__dirname, 'sql', 'group_subjects.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = join(__dirname, 'sql', 'group_subjects.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await queryRunner.query(sql);
  }
}
