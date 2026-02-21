-- V1__initial_schema.sql
-- Initial schema for EstiMate Planning Poker
-- Compatible with PostgreSQL 14+

-- ── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE sessions (
    id                  BIGSERIAL       PRIMARY KEY,
    session_code        VARCHAR(6)      NOT NULL UNIQUE,
    name                VARCHAR(255)    NOT NULL,
    description         VARCHAR(500),
    sizing_method       VARCHAR(50)     NOT NULL,
    custom_values       TEXT,                           -- JSON array via StringListConverter
    moderator_id        BIGINT,                         -- FK added after users table
    current_story_id    BIGINT,                         -- FK added after stories table
    created_at          TIMESTAMP       NOT NULL,
    updated_at          TIMESTAMP,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    votes_revealed      BOOLEAN         NOT NULL DEFAULT FALSE,
    moderator_can_vote  BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Embedded SessionSettings columns
    auto_reveal         BOOLEAN         NOT NULL DEFAULT FALSE,
    timer_enabled       BOOLEAN         NOT NULL DEFAULT FALSE,
    timer_duration      INTEGER                  DEFAULT 300,
    allow_change_vote   BOOLEAN         NOT NULL DEFAULT TRUE,
    allow_observers     BOOLEAN         NOT NULL DEFAULT TRUE,
    require_confidence  BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sessions_session_code  ON sessions (session_code);
CREATE INDEX idx_sessions_is_active     ON sessions (is_active);

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(50)     NOT NULL,
    avatar          VARCHAR(255),
    session_id      BIGINT          NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    is_observer     BOOLEAN         NOT NULL DEFAULT FALSE,
    is_moderator    BOOLEAN         NOT NULL DEFAULT FALSE,
    joined_at       TIMESTAMP       NOT NULL,
    last_seen_at    TIMESTAMP
);

CREATE INDEX idx_users_session_id   ON users (session_id);
CREATE INDEX idx_users_is_active    ON users (session_id, is_active);

-- ── Stories ───────────────────────────────────────────────────────────────────
CREATE TABLE stories (
    id                  BIGSERIAL       PRIMARY KEY,
    title               VARCHAR(200)    NOT NULL,
    description         TEXT,
    acceptance_criteria TEXT,
    tags                TEXT,                           -- JSON array via StringListConverter
    priority            VARCHAR(50)     NOT NULL DEFAULT 'MEDIUM',
    session_id          BIGINT          NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    order_index         INTEGER         NOT NULL DEFAULT 0,
    status              VARCHAR(50)     NOT NULL DEFAULT 'NOT_ESTIMATED',
    final_estimate      VARCHAR(50),
    estimate_notes      TEXT,
    created_at          TIMESTAMP       NOT NULL,
    updated_at          TIMESTAMP
);

CREATE INDEX idx_stories_session_id         ON stories (session_id);
CREATE INDEX idx_stories_session_status     ON stories (session_id, status);
CREATE INDEX idx_stories_order              ON stories (session_id, order_index);

-- ── Votes ─────────────────────────────────────────────────────────────────────
CREATE TABLE votes (
    id          BIGSERIAL       PRIMARY KEY,
    story_id    BIGINT          NOT NULL REFERENCES stories (id) ON DELETE CASCADE,
    user_id     BIGINT          NOT NULL REFERENCES users  (id) ON DELETE CASCADE,
    estimate    VARCHAR(50)     NOT NULL,
    confidence  INTEGER,
    voted_at    TIMESTAMP       NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_votes_story_user UNIQUE (story_id, user_id)
);

CREATE INDEX idx_votes_story_id ON votes (story_id);
CREATE INDEX idx_votes_user_id  ON votes (user_id);

-- ── Deferred FK constraints (circular reference between sessions and users) ──
ALTER TABLE sessions
    ADD CONSTRAINT fk_sessions_moderator
        FOREIGN KEY (moderator_id) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE sessions
    ADD CONSTRAINT fk_sessions_current_story
        FOREIGN KEY (current_story_id) REFERENCES stories (id) ON DELETE SET NULL;
