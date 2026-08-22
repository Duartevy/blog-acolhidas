CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  content VARCHAR(800) NOT NULL CHECK (char_length(content) BETWEEN 1 AND 800),
  topic VARCHAR(80) NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  content VARCHAR(500) NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
  id BIGSERIAL PRIMARY KEY,
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id BIGINT NOT NULL,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('heart', 'support', 'hug')),
  actor_id VARCHAR(128) NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (target_type, target_id, actor_id)
);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS reactions_target_idx ON reactions(target_type, target_id);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS ip_address INET;
CREATE INDEX IF NOT EXISTS posts_ip_address_idx ON posts(ip_address);
CREATE INDEX IF NOT EXISTS comments_ip_address_idx ON comments(ip_address);
