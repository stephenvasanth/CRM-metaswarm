-- V2: Seed default admin user
-- The password hash below is a BCrypt hash (cost 10) of 'Admin1234!'
-- This insert is idempotent: skipped if admin@crm.local already exists.
INSERT INTO users (email, password, first_name, last_name, role, active)
SELECT 'admin@crm.local', '$2a$10$0Ze761AfhN2HxFAnjn2ENOsZSDIMn0ZAqhK7Jz1IXPqBNQO8g1s0i', 'Admin', 'User', 'ADMIN', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@crm.local');
