# 🔧 Visual Database Setup Guide

## Current Status
❌ **DATABASE_URL is still pointing to dashboard URL**
Current: `https://awhumyjuqegrdkafjevt.supabase.co`
Needed: `postgresql://postgres.xxxxx:password@host:6543/postgres`

## Step-by-Step Visual Guide

### Step 1: In Your Supabase Dashboard
1. You should already be in your Supabase project dashboard
2. Look for the left sidebar
3. Find "Settings" (gear icon) and click it
4. Click "Database" from the submenu

### Step 2: Find Connection String
1. Scroll down until you see "Connection string" section
2. You'll see two tabs: "Session" and "Transaction"
3. **Click "Transaction" tab** (this is important!)
4. You'll see a connection string that starts with `postgresql://`

### Step 3: Copy and Modify
1. Copy the entire connection string
2. It will have `[YOUR-PASSWORD]` in it
3. Replace `[YOUR-PASSWORD]` with your actual database password
4. The final string should look like:
   ```
   postgresql://postgres.abcdefg:ACTUAL_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### Step 4: Update in Replit
1. In Replit, click the lock icon (🔒) in the left sidebar
2. Look for `DATABASE_URL` in the list
3. Click on it to edit
4. **Delete the entire current value**
5. Paste the PostgreSQL connection string from Step 3
6. Click "Save" or press Enter

### Step 5: Restart
After updating, the server should automatically restart and connect properly.

## Troubleshooting
- Make sure you're using the "Transaction" connection string (port 6543)
- Double-check you replaced [YOUR-PASSWORD] with your actual password
- The URL should start with `postgresql://` not `https://`

## What Happens Next
Once updated correctly:
- Server will start successfully
- Database schema will auto-apply
- All features will work (enrollments, profiles, etc.)