import { Platform } from 'react-native';

// expo-sqlite is native only — not available on web
const isNative = Platform.OS !== 'web';

let db: any = null;

export async function getDb(): Promise<any> {
  if (!isNative) return null;
  if (!db) {
    const SQLite = await import('expo-sqlite');
    db = await SQLite.openDatabaseAsync('orca.db');
    await initSchema(db);
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
  `);
}
