# Deploying UTHINK to Vercel

This guide will help you deploy your UTHINK platform to Vercel with proper CSP headers for Privy authentication.

## Prerequisites

1. A Vercel account (sign up at vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. Your Supabase database URL
4. Your Privy App ID

## Deployment Steps

### 1. Prepare Your Project

```bash
# Clone or download your project files
# Make sure you have all the files from your Replit workspace
```

### 2. Install Vercel CLI and Login

```bash
npm install -g vercel
vercel login
```

### 3. Configure Environment Variables

In your project root, run:

```bash
vercel env add DATABASE_URL
# Paste your Supabase connection string

vercel env add PRIVY_APP_ID  
# Paste your Privy App ID

vercel env add NODE_ENV
# Type: production
```

### 4. Deploy

```bash
# First deployment
vercel

# Follow the prompts:
# ? Set up and deploy "~/your-project"? Y
# ? Which scope do you want to deploy to? (your account)
# ? Link to existing project? N
# ? What's your project's name? uthink-platform
# ? In which directory is your code located? ./

# Subsequent deployments
vercel --prod
```

### 5. Configure Domain (Optional)

- Go to your Vercel dashboard
- Select your project
- Go to Settings > Domains
- Add your custom domain

## Project Structure for Vercel

```
your-project/
├── vercel.json           # Vercel configuration
├── client/              # React frontend
│   ├── dist/           # Built files (created by npm run build)
│   ├── src/
│   └── package.json
├── server/             # Express backend  
│   ├── dist/          # Compiled TypeScript (created by tsc)
│   ├── *.ts files
│   └── package.json
├── shared/            # Shared schemas
└── package.json       # Root package.json
```

## Environment Variables Needed

- `DATABASE_URL` - Your Supabase connection string
- `PRIVY_APP_ID` - Your Privy application ID  
- `NODE_ENV` - Set to "production"

## CSP Headers Configuration

The `vercel.json` file includes CSP headers that allow:
- Privy authentication frames (`https://auth.privy.io`)
- Web3 wallet connections
- External fonts and images
- Secure script execution

## Troubleshooting

### Build Errors
- Ensure all dependencies are in package.json
- Check TypeScript compilation errors
- Verify environment variables are set

### Authentication Issues
- Confirm Privy App ID is correct
- Check CSP headers in browser dev tools
- Verify domain is added to Privy dashboard

### Database Connection
- Test DATABASE_URL format
- Ensure Supabase allows connections from Vercel IPs
- Check database schema is pushed

## Post-Deployment

1. Test wallet authentication
2. Test Privy email authentication
3. Verify course enrollment works
4. Check live sessions functionality
5. Test admin features

Your UTHINK platform will be available at your Vercel URL with full Privy authentication support!