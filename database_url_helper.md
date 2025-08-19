# 🔧 DATABASE_URL Setup Helper

## Current Issue
The DATABASE_URL is currently set to a Supabase dashboard URL instead of the PostgreSQL connection string.

**Current value:** `https://awhumyjuqegrdkafjevt.supabase.co`
**Needed format:** `postgresql://postgres.xxxxx:PASSWORD@host:6543/postgres`

## Step-by-Step Fix

### 1. Get the Connection String from Supabase
1. Open your Supabase project dashboard
2. Click "Settings" in the left sidebar
3. Click "Database" 
4. Scroll down to "Connection string" section
5. Click "Transaction" tab (NOT Session)
6. Copy the connection string
7. Replace `[YOUR-PASSWORD]` with your actual database password

### 2. Update Replit Secrets
1. In Replit, click the lock icon (🔒) in the left sidebar
2. Find the `DATABASE_URL` entry
3. Click to edit it
4. Replace the entire value with the PostgreSQL connection string from step 1
5. Click save

### 3. Expected Format
The connection string should look like:
```
postgresql://postgres.abcdefg:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## What Happens After Update
Once the DATABASE_URL is correct:
- The server will start successfully
- Database schema will be automatically applied
- All enrollment buttons will work
- Profile updates will save properly
- Course creation will be fully functional

## Need Help?
If you're having trouble finding the connection string in Supabase:
1. Make sure you're in the correct project
2. Look for "Database" under "Settings" (not "Project Settings")
3. The "Transaction" connection string is what we need (port 6543)
4. Remember to replace [YOUR-PASSWORD] with your actual password