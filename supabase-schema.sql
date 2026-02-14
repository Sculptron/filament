-- ============================================================
-- FILAMENT DATABASE SCHEMA
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to create the database tables
-- Dashboard → SQL Editor → New Query → Paste this → Run

-- ============================================================
-- TABLE: constellations
-- ============================================================
-- Stores saved constellation results for sharing and persistence
-- Each constellation has a unique share_id for shareable URLs

CREATE TABLE IF NOT EXISTS constellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL,
  search_type TEXT CHECK (search_type IN ('title', 'guided')) DEFAULT 'title',
  constellation_data JSONB NOT NULL,
  share_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- Create index on share_id for fast lookups when loading shared constellations
CREATE INDEX IF NOT EXISTS idx_constellations_share_id ON constellations(share_id);

-- Create index on created_at for analytics queries
CREATE INDEX IF NOT EXISTS idx_constellations_created_at ON constellations(created_at DESC);

-- ============================================================
-- TABLE: search_logs
-- ============================================================
-- Tracks every search for analytics and rate limiting
-- Used to enforce daily search limits per IP address

CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  ip_address TEXT,
  search_type TEXT CHECK (search_type IN ('title', 'guided')) NOT NULL,
  query_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  constellation_id UUID REFERENCES constellations(id) ON DELETE SET NULL
);

-- Create index for rate limiting queries (check searches by IP in last 24 hours)
CREATE INDEX IF NOT EXISTS idx_search_logs_ip_created ON search_logs(ip_address, created_at DESC);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);

-- Create index for search type analytics
CREATE INDEX IF NOT EXISTS idx_search_logs_type ON search_logs(search_type);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on both tables to control access
-- These policies allow public read access but no direct writes from frontend
-- All writes will happen through the serverless function using service role key

ALTER TABLE constellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read constellations (for shared URLs)
CREATE POLICY "Public read access for constellations"
  ON constellations
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update constellations
-- (Frontend will call API, which uses service role key)
CREATE POLICY "Service role only for constellation writes"
  ON constellations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: No public read access to search_logs (privacy protection)
CREATE POLICY "No public access to search_logs"
  ON search_logs
  FOR SELECT
  USING (false);

-- Policy: Only service role can write to search_logs
CREATE POLICY "Service role only for search_logs writes"
  ON search_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- HELPER FUNCTION: Generate unique share ID
-- ============================================================
-- Creates short, URL-friendly IDs for shareable constellation links
-- Format: 8 random alphanumeric characters (e.g., "a7k9m2x5")

CREATE OR REPLACE FUNCTION generate_share_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================
-- Schema creation complete!
--
-- Next steps:
-- 1. Verify tables were created: Check Tables view in Supabase dashboard
-- 2. Add environment variables to Vercel (if not already added):
--    - SUPABASE_URL (found in Supabase → Settings → API)
--    - SUPABASE_ANON_KEY (found in Supabase → Settings → API)
--    - SUPABASE_SERVICE_ROLE_KEY (found in Supabase → Settings → API)
-- 3. For frontend access, also add to .env.local:
--    - VITE_SUPABASE_URL
--    - VITE_SUPABASE_ANON_KEY
