INSERT INTO users (username, email, password_hash, `role`, created_at, updated_at)
VALUES (
  'admin',
  'admin@example.com',
  '9ca66808836108e712d4b6abb13d5adb0dce8825f44ccee10659b7a74378cab9',
  'system_admin',
  NOW(),
  NOW()
);
