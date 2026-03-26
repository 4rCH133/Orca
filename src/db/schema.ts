import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';

let db: any = null;

export async function getDb(): Promise<any> {
  if (!isNative) return null;
  if (!db) {
    const SQLite = await import('expo-sqlite');
    db = await SQLite.openDatabaseAsync('orca.db');
    await initSchema(db);
    await migrateSchemaV2(db);
  }
  return db;
}

async function initSchema(db: any) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS liked_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      subreddit TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT,
      score INTEGER DEFAULT 0,
      num_comments INTEGER DEFAULT 0,
      created_utc INTEGER NOT NULL,
      permalink TEXT NOT NULL,
      liked_at INTEGER NOT NULL DEFAULT (unixepoch()),
      flair TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS liked_posts_fts
      USING fts5(
        id UNINDEXED,
        title,
        author,
        subreddit,
        flair,
        content='liked_posts',
        content_rowid='rowid'
      );

    CREATE TRIGGER IF NOT EXISTS liked_posts_ai AFTER INSERT ON liked_posts BEGIN
      INSERT INTO liked_posts_fts(rowid, id, title, author, subreddit, flair)
        VALUES (new.rowid, new.id, new.title, new.author, new.subreddit, new.flair);
    END;

    CREATE TRIGGER IF NOT EXISTS liked_posts_ad AFTER DELETE ON liked_posts BEGIN
      INSERT INTO liked_posts_fts(liked_posts_fts, rowid, id, title, author, subreddit, flair)
        VALUES ('delete', old.rowid, old.id, old.title, old.author, old.subreddit, old.flair);
    END;

    CREATE TABLE IF NOT EXISTS saved_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      subreddit TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT,
      score INTEGER DEFAULT 0,
      num_comments INTEGER DEFAULT 0,
      created_utc INTEGER NOT NULL,
      permalink TEXT NOT NULL,
      saved_at INTEGER NOT NULL DEFAULT (unixepoch()),
      flair TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS saved_posts_fts
      USING fts5(
        id UNINDEXED,
        title,
        author,
        subreddit,
        flair,
        content='saved_posts',
        content_rowid='rowid'
      );

    CREATE TRIGGER IF NOT EXISTS saved_posts_ai AFTER INSERT ON saved_posts BEGIN
      INSERT INTO saved_posts_fts(rowid, id, title, author, subreddit, flair)
        VALUES (new.rowid, new.id, new.title, new.author, new.subreddit, new.flair);
    END;

    CREATE TRIGGER IF NOT EXISTS saved_posts_ad AFTER DELETE ON saved_posts BEGIN
      INSERT INTO saved_posts_fts(saved_posts_fts, rowid, id, title, author, subreddit, flair)
        VALUES ('delete', old.rowid, old.id, old.title, old.author, old.subreddit, old.flair);
    END;

    CREATE TABLE IF NOT EXISTS downvoted_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      subreddit TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT,
      score INTEGER DEFAULT 0,
      num_comments INTEGER DEFAULT 0,
      created_utc INTEGER NOT NULL,
      permalink TEXT NOT NULL,
      downvoted_at INTEGER NOT NULL DEFAULT (unixepoch()),
      flair TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS downvoted_posts_fts
      USING fts5(
        id UNINDEXED,
        title,
        author,
        subreddit,
        flair,
        content='downvoted_posts',
        content_rowid='rowid'
      );

    CREATE TRIGGER IF NOT EXISTS downvoted_posts_ai AFTER INSERT ON downvoted_posts BEGIN
      INSERT INTO downvoted_posts_fts(rowid, id, title, author, subreddit, flair)
        VALUES (new.rowid, new.id, new.title, new.author, new.subreddit, new.flair);
    END;

    CREATE TRIGGER IF NOT EXISTS downvoted_posts_ad AFTER DELETE ON downvoted_posts BEGIN
      INSERT INTO downvoted_posts_fts(downvoted_posts_fts, rowid, id, title, author, subreddit, flair)
        VALUES ('delete', old.rowid, old.id, old.title, old.author, old.subreddit, old.flair);
    END;

    CREATE TABLE IF NOT EXISTS read_posts (
      post_id TEXT PRIMARY KEY,
      read_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS visited_posts (
      post_id TEXT PRIMARY KEY,
      visited_at INTEGER NOT NULL DEFAULT (unixepoch()),
      known_comment_ids TEXT NOT NULL DEFAULT '[]'
    );

    -- E4 tables
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3B9FD4',
      icon TEXT NOT NULL DEFAULT '📁',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#8B949E'
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (post_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS content_filters (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'all',
      is_regex INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      match_count INTEGER NOT NULL DEFAULT 0
    );
  `);
}

/**
 * Schema migration v2: Add body_snippet + folder_id columns, rebuild FTS5 with body_snippet.
 * Safe and idempotent — checks if migration already applied before running.
 */
async function migrateSchemaV2(db: any) {
  try {
    const cols = await db.getAllAsync('PRAGMA table_info(liked_posts)');
    const hasBodySnippet = cols.some((c: any) => c.name === 'body_snippet');
    if (hasBodySnippet) return; // Already migrated

    // Add new columns to base tables
    await db.execAsync('ALTER TABLE liked_posts ADD COLUMN body_snippet TEXT');
    await db.execAsync('ALTER TABLE liked_posts ADD COLUMN folder_id TEXT');
    await db.execAsync('ALTER TABLE saved_posts ADD COLUMN body_snippet TEXT');
    await db.execAsync('ALTER TABLE saved_posts ADD COLUMN folder_id TEXT');
    await db.execAsync('ALTER TABLE downvoted_posts ADD COLUMN body_snippet TEXT');
    await db.execAsync('ALTER TABLE downvoted_posts ADD COLUMN folder_id TEXT');

    // Drop old FTS5 tables and triggers (will be recreated with body_snippet)
    await db.execAsync(`
      DROP TABLE IF EXISTS liked_posts_fts;
      DROP TRIGGER IF EXISTS liked_posts_ai;
      DROP TRIGGER IF EXISTS liked_posts_ad;
      DROP TABLE IF EXISTS saved_posts_fts;
      DROP TRIGGER IF EXISTS saved_posts_ai;
      DROP TRIGGER IF EXISTS saved_posts_ad;
      DROP TABLE IF EXISTS downvoted_posts_fts;
      DROP TRIGGER IF EXISTS downvoted_posts_ai;
      DROP TRIGGER IF EXISTS downvoted_posts_ad;
    `);

    // Recreate FTS5 with body_snippet column
    await db.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS liked_posts_fts USING fts5(
        id UNINDEXED, title, author, subreddit, flair, body_snippet,
        content='liked_posts', content_rowid='rowid'
      );
      CREATE TRIGGER IF NOT EXISTS liked_posts_ai AFTER INSERT ON liked_posts BEGIN
        INSERT INTO liked_posts_fts(rowid, id, title, author, subreddit, flair, body_snippet)
          VALUES (new.rowid, new.id, new.title, new.author, new.subreddit, new.flair, new.body_snippet);
      END;
      CREATE TRIGGER IF NOT EXISTS liked_posts_ad AFTER DELETE ON liked_posts BEGIN
        INSERT INTO liked_posts_fts(liked_posts_fts, rowid, id, title, author, subreddit, flair, body_snippet)
          VALUES ('delete', old.rowid, old.id, old.title, old.author, old.subreddit, old.flair, old.body_snippet);
      END;

      CREATE VIRTUAL TABLE IF NOT EXISTS saved_posts_fts USING fts5(
        id UNINDEXED, title, author, subreddit, flair, body_snippet,
        content='saved_posts', content_rowid='rowid'
      );
      CREATE TRIGGER IF NOT EXISTS saved_posts_ai AFTER INSERT ON saved_posts BEGIN
        INSERT INTO saved_posts_fts(rowid, id, title, author, subreddit, flair, body_snippet)
          VALUES (new.rowid, new.id, new.title, new.author, new.subreddit, new.flair, new.body_snippet);
      END;
      CREATE TRIGGER IF NOT EXISTS saved_posts_ad AFTER DELETE ON saved_posts BEGIN
        INSERT INTO saved_posts_fts(saved_posts_fts, rowid, id, title, author, subreddit, flair, body_snippet)
          VALUES ('delete', old.rowid, old.id, old.title, old.author, old.subreddit, old.flair, old.body_snippet);
      END;

      CREATE VIRTUAL TABLE IF NOT EXISTS downvoted_posts_fts USING fts5(
        id UNINDEXED, title, author, subreddit, flair, body_snippet,
        content='downvoted_posts', content_rowid='rowid'
      );
      CREATE TRIGGER IF NOT EXISTS downvoted_posts_ai AFTER INSERT ON downvoted_posts BEGIN
        INSERT INTO downvoted_posts_fts(rowid, id, title, author, subreddit, flair, body_snippet)
          VALUES (new.rowid, new.id, new.title, new.author, new.subreddit, new.flair, new.body_snippet);
      END;
      CREATE TRIGGER IF NOT EXISTS downvoted_posts_ad AFTER DELETE ON downvoted_posts BEGIN
        INSERT INTO downvoted_posts_fts(downvoted_posts_fts, rowid, id, title, author, subreddit, flair, body_snippet)
          VALUES ('delete', old.rowid, old.id, old.title, old.author, old.subreddit, old.flair, old.body_snippet);
      END;
    `);

    // Rebuild FTS5 indexes from existing data
    await db.execAsync("INSERT INTO liked_posts_fts(liked_posts_fts) VALUES('rebuild')");
    await db.execAsync("INSERT INTO saved_posts_fts(saved_posts_fts) VALUES('rebuild')");
    await db.execAsync("INSERT INTO downvoted_posts_fts(downvoted_posts_fts) VALUES('rebuild')");

    console.log('[Orca] Schema v2 migration complete');
  } catch (e) {
    console.warn('[Orca] Schema v2 migration failed:', e);
  }
}
