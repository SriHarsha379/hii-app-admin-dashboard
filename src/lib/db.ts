import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    gender TEXT,
    level TEXT DEFAULT 'BRONZE',
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- SUPER_ADMIN, EVENT_ADMIN, CITY_ADMIN, CLUB_ADMIN
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    contact_info TEXT,
    media TEXT, -- JSON string
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    venue_id TEXT,
    date_time DATETIME NOT NULL,
    hide_end_time BOOLEAN DEFAULT 0,
    city TEXT NOT NULL,
    poster_url TEXT,
    landscape_url TEXT,
    synopsis TEXT,
    email TEXT,
    phone TEXT,
    ticket_link TEXT,
    media_gallery TEXT, -- JSON string
    music_genre TEXT,
    crowd_type TEXT,
    advertise BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'UPCOMING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES clubs(id)
  );

  CREATE TABLE IF NOT EXISTS ads (
    id TEXT PRIMARY KEY,
    manager_id TEXT,
    title TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'PENDING', -- IN_PROGRESS, COMPLETE, PENDING, APPROVED, REJECTED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES admins(id)
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    ad_id TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES ads(id)
  );

  CREATE TABLE IF NOT EXISTS broadcasts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- PUSH, EMAIL, WHATSAPP
    message TEXT NOT NULL,
    audience TEXT, -- JSON string or selector
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    city TEXT DEFAULT 'ALL',
    options TEXT NOT NULL, -- JSON string
    end_date DATETIME,
    status TEXT DEFAULT 'PENDING',
    votes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    city TEXT,
    rules TEXT,
    reward TEXT,
    deadline DATETIME,
    status TEXT DEFAULT 'PENDING',
    participants INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contest_participants (
    id TEXT PRIMARY KEY,
    contest_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    submission_url TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    username TEXT,
    subject TEXT,
    message TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    username TEXT,
    subject TEXT,
    message TEXT,
    priority TEXT DEFAULT 'LOW',
    status TEXT DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id)
  );

  CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS genres (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS event_types (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS venue_types (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial local fallback data for legacy SQLite-backed admin screens.
const cityCount = db.prepare('SELECT COUNT(*) as count FROM cities').get() as { count: number };
if (cityCount.count === 0) {
  const insertCity = db.prepare('INSERT INTO cities (id, name) VALUES (?, ?)');
  ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Pune', 'Hyderabad'].forEach(city => {
    insertCity.run(crypto.randomUUID(), city);
  });
}

export default db;
