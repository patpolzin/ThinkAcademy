// Fix missing columns in quizzes table
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

async function fixColumns() {
  const sql = postgres(parseSupabaseUrl(process.env.DATABASE_URL));
  
  try {
    console.log('Adding missing columns to quizzes table...');
    await sql`
      ALTER TABLE quizzes 
      ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0
    `;
    
    console.log('Adding missing columns to forums table...');
    await sql`
      ALTER TABLE forums 
      ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0
    `;
    
    console.log('Columns added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding columns:', error.message);
    return false;
  } finally {
    await sql.end();
  }
}

fixColumns().then(success => process.exit(success ? 0 : 1));