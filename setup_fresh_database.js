// Setup script to initialize fresh Supabase database with proper schema
import postgres from "postgres";

// Parse DATABASE_URL safely to handle special characters in password
function parseSupabaseUrl(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  
  const [, username, password, host, port, database] = match;
  
  return {
    host,
    port: parseInt(port),
    database,
    username,
    password: decodeURIComponent(password),
    ssl: 'require',
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  };
}

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }
  
  const connectionConfig = parseSupabaseUrl(connectionString);
  const sql = postgres(connectionConfig);
  
  try {
    console.log('🔄 Setting up fresh database schema...');
    
    // Check if tables exist
    const tablesCheck = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('users', 'courses', 'enrollments')
    `;
    
    if (tablesCheck.length === 0) {
      console.log('📋 No tables found. Database needs to be initialized with schema.');
      console.log('Please run the DATABASE_SCHEMA.sql file in your Supabase SQL editor.');
      return false;
    }
    
    console.log('✅ Database tables found:', tablesCheck.map(t => t.table_name));
    
    // Test basic queries
    const courses = await sql`SELECT COUNT(*) as count FROM courses`;
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    const enrollments = await sql`SELECT COUNT(*) as count FROM enrollments`;
    
    console.log('📊 Database status:');
    console.log(`  - Courses: ${courses[0].count}`);
    console.log(`  - Users: ${users[0].count}`);
    console.log(`  - Enrollments: ${enrollments[0].count}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    return false;
  } finally {
    await sql.end();
  }
}

setupDatabase().then(success => {
  if (success) {
    console.log('🎉 Database is ready!');
  } else {
    console.log('⚠️  Database needs schema initialization.');
  }
  process.exit(success ? 0 : 1);
});