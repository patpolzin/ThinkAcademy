// Simple table creation script
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

async function createTables() {
  const sql = postgres(parseSupabaseUrl(process.env.DATABASE_URL));
  
  try {
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT UNIQUE,
        email TEXT UNIQUE,
        display_name TEXT NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        is_instructor BOOLEAN DEFAULT FALSE,
        token_balances JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('Creating courses table...');
    await sql`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        difficulty TEXT,
        thumbnail TEXT,
        instructor_name TEXT,
        instructor_id INTEGER REFERENCES users(id),
        token_requirement JSONB DEFAULT '{"type": "NONE"}',
        is_active BOOLEAN DEFAULT TRUE,
        duration INTEGER DEFAULT 0,
        lesson_count INTEGER DEFAULT 0,
        assignment_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('Creating enrollments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        progress INTEGER DEFAULT 0,
        progress_percentage INTEGER DEFAULT 0,
        total_lessons INTEGER DEFAULT 0,
        total_assignments INTEGER DEFAULT 0,
        completed_lessons INTEGER DEFAULT 0,
        completed_assignments INTEGER DEFAULT 0,
        certificate_issued BOOLEAN DEFAULT FALSE,
        certificate_url TEXT,
        enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(user_id, course_id)
      )
    `;
    
    console.log('Creating lessons table...');
    await sql`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        video_url TEXT,
        order_index INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('Creating live_sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS live_sessions (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        instructor_id INTEGER REFERENCES users(id),
        session_date TIMESTAMP WITH TIME ZONE NOT NULL,
        duration INTEGER DEFAULT 60,
        meeting_url TEXT,
        token_requirement JSONB DEFAULT '{"type": "NONE"}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('Inserting sample users...');
    await sql`
      INSERT INTO users (wallet_address, email, display_name, bio, is_admin, is_instructor, token_balances)
      VALUES 
        ('0x1234567890abcdef1234567890abcdef12345678', 'admin@uthink.com', 'Admin User', 'Platform Administrator', true, true, '{"THINK": 1000000, "NFT": 5}')
      ON CONFLICT (wallet_address) DO NOTHING
    `;
    
    await sql`
      INSERT INTO users (wallet_address, email, display_name, bio, is_admin, is_instructor, token_balances)
      VALUES 
        ('0xabcdef1234567890abcdef1234567890abcdef12', 'instructor@uthink.com', 'Dr. Sarah Chen', 'Blockchain Expert & Educator', false, true, '{"THINK": 500000, "NFT": 3}')
      ON CONFLICT (wallet_address) DO NOTHING
    `;
    
    await sql`
      INSERT INTO users (wallet_address, email, display_name, bio, is_admin, is_instructor, token_balances)
      VALUES 
        ('0x9876543210fedcba9876543210fedcba98765432', 'student@uthink.com', 'Alex Johnson', 'Aspiring Web3 Developer', false, false, '{"THINK": 1000, "NFT": 1}')
      ON CONFLICT (wallet_address) DO NOTHING
    `;
    
    console.log('Inserting sample courses...');
    await sql`
      INSERT INTO courses (title, description, category, difficulty, instructor_name, instructor_id, token_requirement, duration, lesson_count, assignment_count)
      VALUES 
        ('Blockchain Fundamentals', 'Learn the basics of blockchain technology and cryptocurrencies', 'Blockchain', 'Beginner', 'Dr. Sarah Chen', 2, '{"type": "THINK", "amount": 100}', 8, 12, 3)
    `;
    
    await sql`
      INSERT INTO courses (title, description, category, difficulty, instructor_name, instructor_id, token_requirement, duration, lesson_count, assignment_count)
      VALUES 
        ('Smart Contract Development', 'Master Solidity and build decentralized applications', 'Development', 'Intermediate', 'Dr. Sarah Chen', 2, '{"type": "NFT", "contractAddress": "0x742d35cc6644c89532e51b0cd2ba4a68c8b70e30"}', 12, 20, 5)
    `;
    
    await sql`
      INSERT INTO courses (title, description, category, difficulty, instructor_name, instructor_id, token_requirement, duration, lesson_count, assignment_count)
      VALUES 
        ('DeFi Protocols Deep Dive', 'Advanced course on decentralized finance protocols', 'DeFi', 'Advanced', 'Dr. Sarah Chen', 2, '{"type": "EITHER", "think": 1000, "nft": "0x742d35cc6644c89532e51b0cd2ba4a68c8b70e30"}', 16, 25, 8)
    `;
    
    console.log('Database setup complete!');
    return true;
  } catch (error) {
    console.error('Setup error:', error.message);
    return false;
  } finally {
    await sql.end();
  }
}

createTables().then(success => process.exit(success ? 0 : 1));