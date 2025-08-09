# Admin & Instructor Setup Guide

This guide explains how to set up admin and instructor permissions in the UTHINK platform using Supabase database flags.

## Setting Admin Permissions

### Method 1: API Endpoint (Recommended)
```bash
curl -X POST http://localhost:5000/api/admin/make-admin/WALLET_ADDRESS \
  -H "Content-Type: application/json"
```

### Method 2: Direct Database Access
1. Open your Supabase dashboard
2. Navigate to Table Editor > users table
3. Find the user by wallet address
4. Set `is_admin` = true

## Setting Instructor Permissions

### Method 1: API Endpoint (Recommended)
```bash
curl -X POST http://localhost:5000/api/admin/make-instructor/WALLET_ADDRESS \
  -H "Content-Type: application/json"
```

### Method 2: Direct Database Access
1. Open your Supabase dashboard
2. Navigate to Table Editor > users table
3. Find the user by wallet address
4. Set `is_instructor` = true

## Permission-Based UI Features

### Admin Access:
- Admin dashboard tab with user management
- Course creation and management
- Analytics and reporting
- User permission management
- System configuration

### Instructor Access:
- Instructor dashboard tab
- Course creation (limited)
- Student progress tracking
- Session scheduling
- Assignment management

### Regular User Access:
- Course enrollment and progress
- Live session participation
- Profile management
- Certificate viewing

## Testing Permissions

1. **Create admin user:**
   ```bash
   curl -X POST http://localhost:5000/api/admin/make-admin/0x021bf842672bcd02ebc3765d911d09af216f2f1c
   ```

2. **Create instructor user:**
   ```bash
   curl -X POST http://localhost:5000/api/admin/make-instructor/0x021bf842672bcd02ebc3765d911d09af216f2f1c
   ```

3. **Connect wallet and verify UI shows appropriate tabs**

## Permission Hierarchy

1. **Admin** - Full access to all features
2. **Instructor** - Course management and student tracking
3. **Student** - Learning and progress tracking only

The UI dynamically shows/hides tabs based on the user's database permissions, ensuring secure access control.