-- ============================================================================
-- GF-AI / ADA V2.0 PRODUCTION RELATIONAL DATABASE SCHEMA
-- Compatible with PostgreSQL (Supabase / Neon) & SQLite
-- ============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    user_name VARCHAR(128) NOT NULL DEFAULT 'User',
    email VARCHAR(255) UNIQUE,
    role VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'guest')),
    password_hash VARCHAR(255),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- 2. User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(16) NOT NULL DEFAULT 'auto',
    mode VARCHAR(32) NOT NULL DEFAULT 'companion',
    humor INTEGER NOT NULL DEFAULT 65 CHECK (humor BETWEEN 0 AND 100),
    warmth INTEGER NOT NULL DEFAULT 85 CHECK (warmth BETWEEN 0 AND 100),
    formality INTEGER NOT NULL DEFAULT 40 CHECK (formality BETWEEN 0 AND 100),
    directness INTEGER NOT NULL DEFAULT 75 CHECK (directness BETWEEN 0 AND 100),
    flirtiness INTEGER NOT NULL DEFAULT 45 CHECK (flirtiness BETWEEN 0 AND 100),
    talkativeness INTEGER NOT NULL DEFAULT 55 CHECK (talkativeness BETWEEN 0 AND 100),
    hologram_color VARCHAR(32) NOT NULL DEFAULT '#00f3ff',
    render_mode VARCHAR(32) NOT NULL DEFAULT 'holo-lite',
    avatar_model_url VARCHAR(255) NOT NULL DEFAULT '/models/miku.vrm',
    skin_id VARCHAR(64) NOT NULL DEFAULT 'miku-classic-idol',
    hands_free BOOLEAN NOT NULL DEFAULT FALSE,
    wake_word_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    memory_consent BOOLEAN NOT NULL DEFAULT TRUE,
    camera_consent BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start VARCHAR(8) NOT NULL DEFAULT '23:00',
    quiet_hours_end VARCHAR(8) NOT NULL DEFAULT '07:00',
    daily_proactive_cap INTEGER NOT NULL DEFAULT 3,
    low_performance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    sound_volume NUMERIC(4, 2) NOT NULL DEFAULT 0.85,
    updated_at BIGINT NOT NULL
);

-- 3. Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Conversation',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON chat_conversations(user_id);

-- 4. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender VARCHAR(32) NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    mood VARCHAR(32),
    reaction VARCHAR(64),
    tokens INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_user_created ON chat_messages(user_id, created_at DESC);

-- 5. Consented Long-Term Memories Table
CREATE TABLE IF NOT EXISTS memories (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    importance INTEGER NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(64) DEFAULT 'chat',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT uq_user_memory_key UNIQUE (user_id, key)
);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);

-- 6. Notes and Tasks Table
CREATE TABLE IF NOT EXISTS notes_tasks (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    category VARCHAR(64) NOT NULL DEFAULT 'note',
    due_date BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes_tasks(user_id);

-- 7. Mood Journals Table
CREATE TABLE IF NOT EXISTS mood_journals (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood VARCHAR(64) NOT NULL,
    valence NUMERIC(4, 2) NOT NULL,
    energy NUMERIC(4, 2) NOT NULL,
    note TEXT,
    tags TEXT,
    created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mood_user_created ON mood_journals(user_id, created_at DESC);

-- 8. Relationship Journals Table
CREATE TABLE IF NOT EXISTS relationship_journals (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL CHECK (type IN ('shared_joke', 'user_preference', 'milestone', 'shared_memory')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    edited_by_user BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rel_journal_user ON relationship_journals(user_id);

-- 9. Uploaded Documents Table
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL UNIQUE,
    mime_type VARCHAR(128) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_uploaded_docs_user ON uploaded_documents(user_id);

-- 10. RAG Document Chunks Table
CREATE TABLE IF NOT EXISTS rag_document_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) REFERENCES uploaded_documents(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    doc_title VARCHAR(255) NOT NULL,
    chunk_text TEXT NOT NULL,
    source_citation VARCHAR(255) NOT NULL,
    embedding_model VARCHAR(64),
    created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_user ON rag_document_chunks(user_id);

-- 11. API Usage and Cost Records
CREATE TABLE IF NOT EXISTS api_usage_costs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL,
    model VARCHAR(128) NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    timestamp BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_usage_user_timestamp ON api_usage_costs(user_id, timestamp DESC);

-- 12. Security and Audit Events Table
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    ip_address VARCHAR(45) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('INFO', 'WARN', 'CRITICAL')),
    details TEXT,
    timestamp BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);

-- 13. Background Jobs Table
CREATE TABLE IF NOT EXISTS background_jobs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    scheduled_for BIGINT NOT NULL,
    executed_at BIGINT,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    payload TEXT,
    created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON background_jobs(user_id, status, scheduled_for);

-- 14. Cryptographic Revoked Tokens (Zero-Trust Shared Store)
CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64),
    expires_at BIGINT NOT NULL,
    revoked_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);

-- 15. Cryptographic Refresh Token Families (Reuse Detection & Hashed Storage)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_hash VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id VARCHAR(64) NOT NULL,
    generation INTEGER NOT NULL DEFAULT 1,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- 16. Magic Links (Hashed Tokens, Single-Use & Brute-Force Lockout)
CREATE TABLE IF NOT EXISTS magic_links (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    lockout_until BIGINT,
    expires_at BIGINT NOT NULL,
    used_at BIGINT,
    created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);

-- ============================================================================
-- POSTGRESQL ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant Data Isolation (Enforced at DB engine layer)
-- ============================================================================
-- ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY user_settings_isolation ON user_settings FOR ALL USING (user_id = current_setting('app.current_user_id', true));
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY chat_messages_isolation ON chat_messages FOR ALL USING (user_id = current_setting('app.current_user_id', true));
-- ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY memories_isolation ON memories FOR ALL USING (user_id = current_setting('app.current_user_id', true));
