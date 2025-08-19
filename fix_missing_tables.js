// Add missing database tables for complete functionality
import postgres from "postgres";

function parseSupabaseUrl(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  const [, username, password, host, port, database] = match;
  return {
    host, port: parseInt(port), database, username,
    password: decodeURIComponent(password),
    ssl: 'require', max: 1, idle_timeout: 20, connect_timeout: 10,
  };
}

async function addMissingTables() {
  const sql = postgres(parseSupabaseUrl(process.env.DATABASE_URL));
  
  try {
    console.log('Adding quizzes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        questions JSONB DEFAULT '[]',
        passing_score INTEGER DEFAULT 70,
        time_limit INTEGER DEFAULT 30,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('Adding resources table...');
    await sql`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT,
        file_type TEXT,
        file_size INTEGER,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('Adding forums table...');
    await sql`
      CREATE TABLE IF NOT EXISTS forums (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_pinned BOOLEAN DEFAULT FALSE,
        reply_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('Fixing live_sessions column name...');
    await sql`
      ALTER TABLE live_sessions 
      ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
    `;
    
    await sql`
      UPDATE live_sessions 
      SET scheduled_at = session_date 
      WHERE scheduled_at IS NULL;
    `;
    
    console.log('Adding sample data...');
    
    await sql`
      INSERT INTO quizzes (course_id, title, description, questions, passing_score, time_limit)
      VALUES (1, 'Blockchain Basics Quiz', 'Test your knowledge of blockchain fundamentals', 
              '[{"question": "What is a blockchain?", "options": ["A database", "A distributed ledger", "A website", "An app"], "correct": 1}]', 
              70, 15)
      ON CONFLICT DO NOTHING
    `;
    
    await sql`
      INSERT INTO resources (course_id, title, description, file_url, file_type)
      VALUES (1, 'Blockchain Whitepaper', 'Original Bitcoin whitepaper by Satoshi Nakamoto', 
              'https://bitcoin.org/bitcoin.pdf', 'PDF')
      ON CONFLICT DO NOTHING
    `;
    
    await sql`
      INSERT INTO forums (course_id, user_id, title, content)
      VALUES (1, 3, 'Welcome to Blockchain Fundamentals!', 
              'Use this forum to ask questions and discuss course content with fellow students.')
      ON CONFLICT DO NOTHING
    `;
    
    console.log('Missing tables added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding tables:', error.message);
    return false;
  } finally {
    await sql.end();
  }
}

addMissingTables().then(success => process.exit(success ? 0 : 1));