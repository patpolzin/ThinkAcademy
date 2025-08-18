# Database Setup Instructions

## Current Issue
The UTHINK platform is configured to use Supabase database, but the DATABASE_URL environment variable is missing, causing all database operations to fail.

## Required Setup Steps

### 1. Supabase Database Configuration
As mentioned in `replit.md`, this project uses Supabase. You need to:

1. Go to the [Supabase dashboard](https://supabase.com/dashboard/projects)
2. Create a new project if you haven't already
3. Once in the project page, click the "Connect" button on the top toolbar
4. Copy URI value under "Connection string" -> "Transaction pooler"
5. Replace `[YOUR-PASSWORD]` with the database password you set for the project

### 2. Environment Variable Setup
Add the DATABASE_URL to your Replit environment:

1. In your Replit project, go to the "Secrets" tab (lock icon in sidebar)
2. Add a new secret with:
   - Key: `DATABASE_URL`
   - Value: Your complete Supabase connection string

### 3. Alternative: Use Replit Database
If you prefer to use Replit's built-in PostgreSQL instead of Supabase:

1. I can provision a Replit PostgreSQL database
2. This will automatically set up the DATABASE_URL
3. All the existing schema and migrations will work

## Current Database Errors
- WebSocket connection failures to Supabase
- All API endpoints returning 500 errors
- Course creation, user management, and analytics all failing

## API Status
✅ Frontend microinteractions and animations are working
✅ Wallet connection UI is functional
❌ Database operations are failing
❌ Course creation is blocked by database issues
❌ User management is not working

## Next Steps
1. Set up the DATABASE_URL with your Supabase credentials, OR
2. Let me know if you'd like me to provision a Replit PostgreSQL database instead

The rest of the backend system (API routes, storage layer, schema) is properly configured and will work once the database connection is established.