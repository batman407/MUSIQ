-- ============================================================
-- MUSIQ OMR — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. score_projects — one row per uploaded score
-- ============================================================
CREATE TABLE IF NOT EXISTS score_projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL DEFAULT 'Untitled Score',
    original_filename TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    file_size       BIGINT,
    page_count      INTEGER DEFAULT 1,
    original_storage_path TEXT,
    status          TEXT NOT NULL DEFAULT 'uploaded'
                    CHECK (status IN ('uploaded','processing','completed','failed','deleted')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_score_projects_user_id ON score_projects(user_id);

-- ============================================================
-- 2. transcription_jobs — one row per OMR job attempt
-- ============================================================
CREATE TABLE IF NOT EXISTS transcription_jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    score_project_id    UUID NOT NULL REFERENCES score_projects(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued','processing','completed','failed')),
    progress_page       INTEGER,
    error_code          TEXT,
    error_message       TEXT,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for project lookups
CREATE INDEX IF NOT EXISTS idx_transcription_jobs_project ON transcription_jobs(score_project_id);

-- ============================================================
-- 3. transcription_results — one row per completed result
-- ============================================================
CREATE TABLE IF NOT EXISTS transcription_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    score_project_id    UUID NOT NULL REFERENCES score_projects(id) ON DELETE CASCADE,
    musicxml_storage_path TEXT,
    mxl_storage_path    TEXT,
    pdf_storage_path    TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for project lookups
CREATE INDEX IF NOT EXISTS idx_transcription_results_project ON transcription_results(score_project_id);

-- ============================================================
-- 4. Row Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE score_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_results ENABLE ROW LEVEL SECURITY;

-- score_projects: users can read/write their own rows
CREATE POLICY "Users can view own score_projects"
    ON score_projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own score_projects"
    ON score_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own score_projects"
    ON score_projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own score_projects"
    ON score_projects FOR DELETE
    USING (auth.uid() = user_id);

-- Service role bypass — backend uses service_role key which bypasses RLS
-- No explicit policy needed for service role

-- transcription_jobs: users can view jobs for their own projects
CREATE POLICY "Users can view own transcription_jobs"
    ON transcription_jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM score_projects sp
            WHERE sp.id = transcription_jobs.score_project_id
            AND sp.user_id = auth.uid()
        )
    );

-- transcription_results: users can view results for their own projects
CREATE POLICY "Users can view own transcription_results"
    ON transcription_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM score_projects sp
            WHERE sp.id = transcription_results.score_project_id
            AND sp.user_id = auth.uid()
        )
    );

-- ============================================================
-- 5. Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_score_projects_updated_at
    BEFORE UPDATE ON score_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. Storage Buckets (run separately in Supabase dashboard
--    or via the storage API — SQL bucket creation is informational)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES
--     ('original-scores', 'original-scores', false),
--     ('transcriptions', 'transcriptions', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies (apply via Supabase dashboard > Storage > Policies):
--
-- original-scores bucket:
--   SELECT: auth.uid()::text = (storage.foldername(name))[1]
--   INSERT: auth.uid()::text = (storage.foldername(name))[1]
--
-- transcriptions bucket:
--   SELECT: auth.uid()::text = (storage.foldername(name))[1]
--
-- The backend uses the service_role key which bypasses storage RLS.

-- ============================================================
-- Storage paths convention:
--   original-scores/{userId}/{projectId}/original.{ext}
--   transcriptions/{userId}/{projectId}/score.mxl
--   transcriptions/{userId}/{projectId}/score.musicxml
-- ============================================================
