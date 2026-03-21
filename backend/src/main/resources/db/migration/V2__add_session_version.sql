-- V2__add_session_version.sql
-- Add optimistic locking version column to sessions table.
-- Prevents lost updates when concurrent requests modify the same session.

ALTER TABLE sessions ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
