// Run the database schema setup automatically
import { readFileSync } from 'fs';
import postgres from "postgres";

// Parse DATABASE_URL safely to handle special characters in password
function parseSupabaseUrl(url) {
  // Check if it's a valid postgresql:// URL
  if (!url.startsWith('postgresql://')) {
    console.error(`❌ Invalid DATABASE_URL format. Expected postgresql://... but got: ${url.substring(0, 50)}...`);
    console.log('\n📋 INSTRUCTIONS TO GET CORRECT DATABASE_URL:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Click "Settings" → "Database"');
    console.log('3. Scroll to "Connection string"');
    console.log('4. Copy the "Transaction" connection string');
    console.log('5. Replace [YOUR-PASSWORD] with your actual password');
    console.log('6. Update DATABASE_URL in Replit Secrets');
    return null;
  }
  
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.error(`❌ Cannot parse DATABASE_URL. Format should be: postgresql://user:pass@host:port/db`);
    return null;
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

async function runSchema() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set in environment variables');
    return false;
  }
  
  console.log('🔗 Parsing DATABASE_URL...');
  const connectionConfig = parseSupabaseUrl(connectionString);
  
  if (!connectionConfig) {
    return false;
  }
  
  console.log('✅ Database URL parsed successfully');
  console.log(`📡 Connecting to: ${connectionConfig.host}:${connectionConfig.port}`);
  
  const sql = postgres(connectionConfig);
  
  try {
    // Test connection first
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Read the schema file
    const schemaSQL = readFileSync('DATABASE_SCHEMA.sql', 'utf8');
    console.log('📋 Running database schema...');
    
    // Split by semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement + ';');
      }
    }
    
    console.log('✅ Schema executed successfully');
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📊 Created tables:');
    tables.forEach(table => console.log(`  - ${table.table_name}`));
    
    // Get row counts
    const courses = await sql`SELECT COUNT(*) as count FROM courses`;
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    const enrollments = await sql`SELECT COUNT(*) as count FROM enrollments`;
    
    console.log('\n📈 Sample data inserted:');
    console.log(`  - Users: ${users[0].count}`);
    console.log(`  - Courses: ${courses[0].count}`);
    console.log(`  - Enrollments: ${enrollments[0].count}`);
    
    console.log('\n🎉 Database setup complete! All features are now functional.');
    
    return true;
  } catch (error) {
    console.error('❌ Schema execution error:', error.message);
    return false;
  } finally {
    await sql.end();
  }
}

runSchema().then(success => {
  process.exit(success ? 0 : 1);
});