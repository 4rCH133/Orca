-- ============================================================
-- Orca App — Supabase Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- fuzzy text search

-- ============================================================
-- Users (mirrors Reddit identity, stored after OAuth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reddit_id     TEXT UNIQUE NOT NULL,
  username      TEXT NOT NULL,
  icon_url      TEXT,
  total_karma   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- User Preferences (theme, layout, filters)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id          UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  theme            TEXT DEFAULT 'system' CHECK (theme IN ('system','light','dark','oled')),
  feed_layout      TEXT DEFAULT 'card' CHECK (feed_layout IN ('card','compact','list')),
  default_sort     TEXT DEFAULT 'best',
  auto_play_video  BOOLEAN DEFAULT FALSE,
  blur_nsfw        BOOLEAN DEFAULT TRUE,
  show_flair       BOOLEAN DEFAULT TRUE,
  custom_colors    JSONB DEFAULT '{}',
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Subscribed Subreddits (synced from Reddit, cached here)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subreddit    TEXT NOT NULL,
  display_name TEXT NOT NULL,
  icon_url     TEXT,
  pinned       BOOLEAN DEFAULT FALSE,
  sort_order   INTEGER DEFAULT 0,
  synced_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, subreddit)
);

CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);

-- ============================================================
-- Post Interaction Log (upvotes, saves — synced from Reddit)
-- Stored here to enable cross-device search & filters
-- ============================================================
CREATE TYPE interaction_type AS ENUM ('upvote', 'downvote', 'save', 'hide');

CREATE TABLE IF NOT EXISTS public.post_interactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id       TEXT NOT NULL,               -- Reddit post ID (t3_xxxx)
  type          interaction_type NOT NULL,
  title         TEXT NOT NULL,
  subreddit     TEXT NOT NULL,
  author        TEXT NOT NULL,
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  score         INTEGER DEFAULT 0,
  num_comments  INTEGER DEFAULT 0,
  flair         TEXT,
  created_utc   BIGINT NOT NULL,
  interacted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id, type)
);

-- Full-text search index on title + subreddit + author
CREATE INDEX post_interactions_user_idx ON public.post_interactions(user_id);
CREATE INDEX post_interactions_fts_idx ON public.post_interactions
  USING GIN (to_tsvector('english', title || ' ' || subreddit || ' ' || author || ' ' || COALESCE(flair, '')));
CREATE INDEX post_interactions_subreddit_idx ON public.post_interactions(user_id, subreddit);
CREATE INDEX post_interactions_type_idx ON public.post_interactions(user_id, type);

-- ============================================================
-- Custom Feeds (user-created multi-subreddit feeds)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.custom_feeds (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  subreddits  TEXT[] NOT NULL DEFAULT '{}',
  is_public   BOOLEAN DEFAULT FALSE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX custom_feeds_user_idx ON public.custom_feeds(user_id);

-- ============================================================
-- Read Posts (to mark posts as read across devices)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.read_posts (
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id    TEXT NOT NULL,
  read_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX read_posts_user_idx ON public.read_posts(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.read_posts ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own data
CREATE POLICY "users_self" ON public.users
  FOR ALL USING (id = auth.uid()::UUID);

CREATE POLICY "preferences_self" ON public.user_preferences
  FOR ALL USING (user_id = auth.uid()::UUID);

CREATE POLICY "subscriptions_self" ON public.subscriptions
  FOR ALL USING (user_id = auth.uid()::UUID);

CREATE POLICY "interactions_self" ON public.post_interactions
  FOR ALL USING (user_id = auth.uid()::UUID);

CREATE POLICY "custom_feeds_self" ON public.custom_feeds
  FOR ALL USING (user_id = auth.uid()::UUID);

CREATE POLICY "read_posts_self" ON public.read_posts
  FOR ALL USING (user_id = auth.uid()::UUID);

-- Public custom feeds are readable by anyone
CREATE POLICY "custom_feeds_public_read" ON public.custom_feeds
  FOR SELECT USING (is_public = TRUE);

-- ============================================================
-- Functions
-- ============================================================

-- Search post interactions with full-text
CREATE OR REPLACE FUNCTION search_interactions(
  p_user_id UUID,
  p_query   TEXT,
  p_type    interaction_type DEFAULT NULL,
  p_subreddit TEXT DEFAULT NULL,
  p_limit   INTEGER DEFAULT 50,
  p_offset  INTEGER DEFAULT 0
)
RETURNS SETOF public.post_interactions
LANGUAGE sql STABLE
AS $$
  SELECT * FROM public.post_interactions
  WHERE user_id = p_user_id
    AND (p_type IS NULL OR type = p_type)
    AND (p_subreddit IS NULL OR subreddit ILIKE p_subreddit)
    AND (
      p_query = '' OR
      to_tsvector('english', title || ' ' || subreddit || ' ' || author || ' ' || COALESCE(flair, ''))
        @@ plainto_tsquery('english', p_query)
    )
  ORDER BY interacted_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER custom_feeds_updated_at BEFORE UPDATE ON public.custom_feeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
