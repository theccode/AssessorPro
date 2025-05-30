import Database from 'better-sqlite3';

// Create SQLite database
const db = new Database('database.sqlite');
db.pragma('journal_mode = WAL');

console.log('Creating database tables...');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    created_at INTEGER,
    updated_at INTEGER
  );
`);

// Create sessions table for authentication
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
  );
`);

// Create assessments table
db.exec(`
  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'draft',
    building_name TEXT,
    publisher_name TEXT,
    building_location TEXT,
    detailed_address TEXT,
    phone_number TEXT,
    additional_notes TEXT,
    overall_score REAL DEFAULT 0,
    max_possible_score REAL DEFAULT 0,
    completed_sections INTEGER DEFAULT 0,
    total_sections INTEGER DEFAULT 8,
    created_at INTEGER,
    updated_at INTEGER
  );
`);

// Create assessment_sections table
db.exec(`
  CREATE TABLE IF NOT EXISTS assessment_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id INTEGER NOT NULL REFERENCES assessments(id),
    section_type TEXT NOT NULL,
    section_name TEXT NOT NULL,
    score REAL DEFAULT 0,
    max_score REAL DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    variables TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );
`);

// Create assessment_media table
db.exec(`
  CREATE TABLE IF NOT EXISTS assessment_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id INTEGER NOT NULL REFERENCES assessments(id),
    section_type TEXT NOT NULL,
    field_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    file_path TEXT NOT NULL,
    mime_type TEXT,
    created_at INTEGER
  );
`);

// Create indexes
db.exec(`CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);`);
db.exec(`CREATE INDEX IF NOT EXISTS IDX_assessments_user_id ON assessments(user_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS IDX_sections_assessment_id ON assessment_sections(assessment_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS IDX_media_assessment_id ON assessment_media(assessment_id);`);

console.log('Database tables created successfully!');
db.close();