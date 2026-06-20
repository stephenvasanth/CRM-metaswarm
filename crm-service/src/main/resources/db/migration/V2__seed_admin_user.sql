-- V2: Seed default admin user
-- The password hash below is a BCrypt hash (cost 12) of 'Admin1234!'
-- Override at startup via ADMIN_PASSWORD_HASH environment variable if desired.
-- This insert is idempotent: skipped if admin@crm.local already exists.
INSERT INTO users (email, password, first_name, last_name, role, active)
SELECT 'admin@crm.local', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VBFfaJWny', 'Admin', 'User', 'ADMIN', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@crm.local');
