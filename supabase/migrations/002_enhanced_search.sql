-- Enhanced search: field-weighted ranking, highlighted snippets, faceted aggregations.
-- Upgrades the basic search_interactions() to v2 with ts_rank_cd and ts_headline.

-- V2: Field-weighted ranking + highlighted snippets
CREATE OR REPLACE FUNCTION search_interactions_v2(
  p_user_id UUID,
  p_query TEXT,
  p_type interaction_type DEFAULT NULL,
  p_subreddit TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  post_id TEXT,
  type interaction_type,
  title TEXT,
  subreddit TEXT,
  author TEXT,
  url TEXT,
  thumbnail_url TEXT,
  score INTEGER,
  num_comments INTEGER,
  flair TEXT,
  created_utc BIGINT,
  interacted_at TIMESTAMPTZ,
  rank REAL,
  headline TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    pi.id, pi.user_id, pi.post_id, pi.type,
    pi.title, pi.subreddit, pi.author, pi.url, pi.thumbnail_url,
    pi.score, pi.num_comments, pi.flair, pi.created_utc, pi.interacted_at,
    CASE WHEN p_query = '' THEN 0
    ELSE ts_rank_cd(
      setweight(to_tsvector('english', pi.title), 'A') ||
      setweight(to_tsvector('english', pi.subreddit || ' ' || pi.author || ' ' || COALESCE(pi.flair, '')), 'B'),
      plainto_tsquery('english', p_query)
    ) END AS rank,
    CASE WHEN p_query = '' THEN pi.title
    ELSE ts_headline('english', pi.title, plainto_tsquery('english', p_query),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10')
    END AS headline
  FROM post_interactions pi
  WHERE pi.user_id = p_user_id
    AND (p_type IS NULL OR pi.type = p_type)
    AND (p_subreddit IS NULL OR pi.subreddit ILIKE p_subreddit)
    AND (p_date_from IS NULL OR pi.interacted_at >= p_date_from)
    AND (p_date_to IS NULL OR pi.interacted_at <= p_date_to)
    AND (p_query = '' OR
      to_tsvector('english', pi.title || ' ' || pi.subreddit || ' ' || pi.author || ' ' || COALESCE(pi.flair, ''))
      @@ plainto_tsquery('english', p_query))
  ORDER BY
    CASE WHEN p_query = '' THEN 0 ELSE rank END DESC,
    pi.interacted_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- Facet aggregation: count interactions by subreddit and type
CREATE OR REPLACE FUNCTION get_interaction_facets(
  p_user_id UUID,
  p_query TEXT DEFAULT ''
)
RETURNS TABLE (
  subreddit TEXT,
  type TEXT,
  cnt BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT pi.subreddit, pi.type::TEXT, COUNT(*) AS cnt
  FROM post_interactions pi
  WHERE pi.user_id = p_user_id
    AND (p_query = '' OR
      to_tsvector('english', pi.title || ' ' || pi.subreddit || ' ' || pi.author || ' ' || COALESCE(pi.flair, ''))
      @@ plainto_tsquery('english', p_query))
  GROUP BY pi.subreddit, pi.type
  ORDER BY cnt DESC;
$$;
