-- V1: Create all CRM domain tables
-- Idempotent: uses IF NOT EXISTS throughout

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies (name);

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    colour     VARCHAR(7)   NOT NULL DEFAULT '#6366F1',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
    id          BIGSERIAL PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(255),
    phone       VARCHAR(50),
    job_title   VARCHAR(255),
    company_id  BIGINT REFERENCES companies (id) ON DELETE SET NULL,
    owner_id    BIGINT REFERENCES users (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_email     ON contacts (email);
CREATE INDEX IF NOT EXISTS idx_contacts_company   ON contacts (company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner     ON contacts (owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name      ON contacts (last_name, first_name);

-- ============================================================
-- CONTACT_TAGS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id BIGINT NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    tag_id     BIGINT NOT NULL REFERENCES tags (id)     ON DELETE CASCADE,
    PRIMARY KEY (contact_id, tag_id)
);

-- ============================================================
-- DEALS
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(255)   NOT NULL,
    value            NUMERIC(15, 2) NOT NULL DEFAULT 0,
    stage            VARCHAR(30)    NOT NULL DEFAULT 'LEAD',
    expected_close   DATE,
    notes            TEXT,
    contact_id       BIGINT REFERENCES contacts (id) ON DELETE SET NULL,
    owner_id         BIGINT REFERENCES users (id)    ON DELETE SET NULL,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT deals_stage_check CHECK (
        stage IN ('LEAD','QUALIFIED','PROPOSAL','NEGOTIATION','CLOSED_WON','CLOSED_LOST')
    )
);

CREATE INDEX IF NOT EXISTS idx_deals_stage    ON deals (stage);
CREATE INDEX IF NOT EXISTS idx_deals_contact  ON deals (contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner    ON deals (owner_id);

-- ============================================================
-- ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
    id          BIGSERIAL PRIMARY KEY,
    type        VARCHAR(20)  NOT NULL,
    subject     VARCHAR(255) NOT NULL,
    notes       TEXT,
    occurred_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    contact_id  BIGINT REFERENCES contacts (id) ON DELETE CASCADE,
    deal_id     BIGINT REFERENCES deals (id)    ON DELETE SET NULL,
    author_id   BIGINT REFERENCES users (id)    ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT activities_type_check CHECK (
        type IN ('CALL','EMAIL','MEETING','NOTE')
    )
);

CREATE INDEX IF NOT EXISTS idx_activities_contact    ON activities (contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal       ON activities (deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_author     ON activities (author_id);
CREATE INDEX IF NOT EXISTS idx_activities_occurred   ON activities (occurred_at DESC);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    due_date    DATE,
    completed   BOOLEAN      NOT NULL DEFAULT FALSE,
    assignee_id BIGINT REFERENCES users (id)    ON DELETE SET NULL,
    contact_id  BIGINT REFERENCES contacts (id) ON DELETE SET NULL,
    deal_id     BIGINT REFERENCES deals (id)    ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee  ON tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact   ON tasks (contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal      ON tasks (deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date  ON tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks (completed);
