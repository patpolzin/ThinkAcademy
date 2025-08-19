// Direct database setup through SQL execution
import { readFileSync } from 'fs';
import postgres from "postgres";

async function setupDatabase() {
  // Parse DATABASE_URL
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

  const connectionConfig = parseSupabaseUrl(process.env.DATABASE_URL);
  const sql = postgres(connectionConfig);
  
  try {
    console.log('✅ Database connection successful');
    
    // Read and execute schema
    const schemaSQL = readFileSync('DATABASE_SCHEMA.sql', 'utf8');
    
    // Execute schema in chunks to handle complex SQL
    console.log('📋 Creating database schema...');
    
    // Create tables first
    await sql`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
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
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
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
      );
    `;
    
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
      );
    `;
    
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
      );
    `;
    
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
      );
    `;
    
    console.log('✅ Tables created successfully');
    
    // Insert sample data
    console.log('📊 Inserting sample data...');
    
    // Insert users
    await sql`
      INSERT INTO users (wallet_address, email, display_name, bio, is_admin, is_instructor, token_balances)
      VALUES 
        ('0x1234567890abcdef1234567890abcdef12345678', 'admin@uthink.com', 'Admin User', 'Platform Administrator', true, true, '{"THINK": 1000000, "NFT": 5}'),
        ('0xabcdef1234567890abcdef1234567890abcdef12', 'instructor@uthink.com', 'Dr. Sarah Chen', 'Blockchain Expert & Educator', false, true, '{"THINK": 500000, "NFT": 3}'),
        ('0x9876543210fedcba9876543210fedcba98765432', 'student@uthink.com', 'Alex Johnson', 'Aspiring Web3 Developer', false, false, '{"THINK": 1000, "NFT": 1}')
      ON CONFLICT (wallet_address) DO NOTHING;
    `;
    
    // Insert courses
    await sql`
      INSERT INTO courses (title, description, category, difficulty, instructor_name, instructor_id, token_requirement, duration, lesson_count, assignment_count)
      VALUES 
        ('Blockchain Fundamentals', 'Learn the basics of blockchain technology and cryptocurrencies', 'Blockchain', 'Beginner', 'Dr. Sarah Chen', 2, '{"type": "THINK", "amount": 100}', 8, 12, 3),
        ('Smart Contract Development', 'Master Solidity and build decentralized applications', 'Development', 'Intermediate', 'Dr. Sarah Chen', 2, '{"type": "NFT", "contractAddress": "0x742d35cc6644c89532e51b0cd2ba4a68c8b70e30"}', 12, 20, 5),
        ('DeFi Protocols Deep Dive', 'Advanced course on decentralized finance protocols', 'DeFi', 'Advanced', 'Dr. Sarah Chen', 2, '{"type": "EITHER", "think": 1000, "nft": "0x742d35cc6644c89532e51b0cd2ba4a68c8b70e30"}', 16, 25, 8)
      ON CONFLICT DO NOTHING;
    `;
    
    // Insert sample enrollments
    await sql`
      INSERT INTO enrollments (user_id, course_id, progress, completed_lessons, total_lessons)
      VALUES 
        (3, 1, 75, 9, 12),
        (3, 2, 30, 6, 20)
      ON CONFLICT (user_id, course_id) DO NOTHING;
    `;
    
    // Insert sample lessons
    await sql`
      INSERT INTO lessons (course_id, title, description, content, order_index, duration)
      VALUES 
        (1, 'Introduction to Blockchain', 'Understanding the fundamentals of blockchain technology', 'Welcome to the world of blockchain...', 1, 45),
        (1, 'Cryptocurrency Basics', 'Learn about Bitcoin, Ethereum, and other cryptocurrencies', 'Cryptocurrencies are digital assets...', 2, 50),
        (2, 'Solidity Basics', 'Introduction to Solidity programming language', 'Solidity is a statically-typed programming language...', 1, 60)
      ON CONFLICT DO NOTHING;
    `;
    
    // Insert sample live session
    await sql`
      INSERT INTO live_sessions (title, description, course_id, instructor_id, session_date, duration, token_requirement)
      VALUES 
        ('Live Q&A: Blockchain Fundamentals', 'Interactive session to discuss course concepts', 1, 2, NOW() + INTERVAL '7 days', 90, '{"type": "THINK", "amount": 100}')
      ON CONFLICT DO NOTHING;
    `;
    
    console.log('✅ Sample data inserted successfully');
    
    // Verify setup
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const courses = await sql`SELECT COUNT(*) as count FROM courses`;
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    const enrollments = await sql`SELECT COUNT(*) as count FROM enrollments`;
    
    console.log('\n🎉 Database setup complete!');
    console.log(`📊 Tables: ${tables.map(t => t.table_name).join(', ')}`);
    console.log(`📈 Data: ${users[0].count} users, ${courses[0].count} courses, ${enrollments[0].count} enrollments`);
    
    return true;
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    return false;
  } finally {
    await sql.end();
  }
}

setupDatabase().then(success => {
  process.exit(success ? 0 : 1);
});