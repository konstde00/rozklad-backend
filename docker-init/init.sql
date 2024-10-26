-- docker-init/init.sql

-- Grant necessary privileges to 'user' from any host ('%')
GRANT CREATE, DROP, ALTER, SELECT, INSERT, UPDATE, DELETE ON *.* TO 'user'@'%' IDENTIFIED BY 'password';

-- Allow the user to create databases
GRANT CREATE DATABASE ON *.* TO 'user'@'%';

-- Apply changes
FLUSH PRIVILEGES;
