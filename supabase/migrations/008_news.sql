-- News posts and reactions

CREATE TABLE IF NOT EXISTS news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, account_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_news_posts_studio ON news_posts(studio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_reactions_post ON news_reactions(post_id);

-- RLS
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_posts_studio_select" ON news_posts FOR SELECT USING (studio_id = get_user_studio_id());
CREATE POLICY "news_posts_studio_insert" ON news_posts FOR INSERT WITH CHECK (studio_id = get_user_studio_id());
CREATE POLICY "news_posts_studio_update" ON news_posts FOR UPDATE USING (studio_id = get_user_studio_id());
CREATE POLICY "news_posts_studio_delete" ON news_posts FOR DELETE USING (studio_id = get_user_studio_id());

CREATE POLICY "news_reactions_studio_select" ON news_reactions FOR SELECT USING (
  post_id IN (SELECT id FROM news_posts WHERE studio_id = get_user_studio_id())
);
CREATE POLICY "news_reactions_studio_insert" ON news_reactions FOR INSERT WITH CHECK (
  post_id IN (SELECT id FROM news_posts WHERE studio_id = get_user_studio_id())
);
CREATE POLICY "news_reactions_studio_delete" ON news_reactions FOR DELETE USING (
  account_id = (SELECT id FROM accounts WHERE auth_user_id = auth.uid() LIMIT 1)
);
