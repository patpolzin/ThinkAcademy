import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Parse Supabase URL from DATABASE_URL and handle special characters in password
function parseSupabaseUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith('postgresql://')) {
    throw new Error(`Invalid DATABASE_URL format. Expected postgresql://... but got: ${databaseUrl.substring(0, 50)}...`);
  }
  
  // Extract components manually to handle special characters in password
  const match = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/(.+)/);
  if (!match) {
    throw new Error(`Cannot parse DATABASE_URL. Format should be: postgresql://user:pass@host:port/db`);
  }
  
  const [, username, password, host, port = '6543', database] = match;
  
  // Extract project reference from hostname for Supabase client
  let projectRef = host.split('.')[0];
  if (projectRef.startsWith('postgres.')) {
    projectRef = projectRef.replace('postgres.', '');
  }
  if (projectRef.startsWith('aws-')) {
    // For pooler URLs, extract the actual project reference
    projectRef = projectRef.split('-').pop() || projectRef;
  }
  
  return {
    host,
    port: parseInt(port),
    database,
    username,
    password, // Keep raw password for postgres connection
    projectRef,
    // Build Supabase URL from the project reference
    supabaseUrl: `https://${projectRef}.supabase.co`,
    // Use service role key pattern
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  };
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
const supabaseConfig = parseSupabaseUrl(connectionString);

// Create Supabase client (if service role key is available)
export const supabase = supabaseConfig.serviceRoleKey 
  ? createClient(supabaseConfig.supabaseUrl, supabaseConfig.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Create Drizzle connection with PostgreSQL client
const connectionConfig = {
  host: supabaseConfig.host,
  port: supabaseConfig.port,
  database: supabaseConfig.database,
  username: supabaseConfig.username,
  password: supabaseConfig.password,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 60,
};

const client = postgres(connectionConfig);
export const db = drizzle(client, { schema });

// Helper function to get user by wallet address with Supabase
export async function getUserByWallet(walletAddress: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error getting user:', error);
      return null;
    }
    return data;
  }
  
  // Fallback to Drizzle if Supabase client isn't available
  const result = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.walletAddress, walletAddress.toLowerCase())
  });
  return result || null;
}

// Helper function to create user with Supabase
export async function createUserWithSupabase(userData: {
  walletAddress: string;
  email?: string;
  displayName?: string;
  isAdmin?: boolean;
  isInstructor?: boolean;
}) {
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        wallet_address: userData.walletAddress.toLowerCase(),
        email: userData.email,
        display_name: userData.displayName || userData.walletAddress.slice(-8),
        is_admin: userData.isAdmin || false,
        is_instructor: userData.isInstructor || false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating user:', error);
      throw error;
    }
    return data;
  }
  
  // Fallback to Drizzle
  const result = await db.insert(schema.users).values({
    walletAddress: userData.walletAddress.toLowerCase(),
    email: userData.email,
    displayName: userData.displayName || userData.walletAddress.slice(-8),
    isAdmin: userData.isAdmin || false,
    isInstructor: userData.isInstructor || false
  }).returning();
  
  return result[0];
}

export { supabaseConfig };