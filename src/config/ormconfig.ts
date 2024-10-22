
import { DataSource } from 'typeorm';
import { join } from 'path';

export const connectionSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'user',
  password: 'password',
  database: 'db',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  subscribers: [join(__dirname, '/subscribers', '*.{ts,js}')],
  synchronize: false,
  logging: false,
  migrationsTableName: 'migrations',
});
