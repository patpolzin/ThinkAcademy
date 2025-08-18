# Overview

EduDAO is a token-gated learning platform that combines blockchain technology with educational content delivery. The platform allows users to access courses and live sessions based on their token holdings (ERC-20 tokens or NFTs). It features a React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and integrating with Ethereum wallets for authentication and token verification.

# User Preferences

Preferred communication style: Simple, everyday language.
Platform branding: UTHINK with "U" highlighted in cyan color to represent university concept.
Color scheme: Cyan/teal primary colors with dark mode as default.
Authentication: MetaMask wallet connection (fully functional) and Privy email+assigned wallet (requires Replit CSP configuration).
UI: Single "Login" button in header navigation (removed duplicate login button from main content).
Deployment: Interested in Vercel deployment for full Privy authentication support.
Database: Supabase integration for comprehensive user management with wallet address mapping, enrollment history, certificate tracking, and permission-based UI access.
User Management: Admin/instructor permissions controlled via Supabase database flags (isAdmin, isInstructor) with dynamic UI visibility based on user roles. Use API endpoints or direct Supabase access to set permissions.
Accessibility: WCAG AAA compliant contrast ratios implemented across all text elements for optimal readability.
Animations: Comprehensive microinteractions implemented for buttons, navigation, and card components with smooth transitions, hover effects, and loading states.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui for consistent design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Context for wallet state, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with centralized error handling
- **Session Management**: Express sessions with PostgreSQL storage
- **Development**: Hot reloading with Vite middleware integration

## Authentication & Authorization
- **Wallet Authentication**: MetaMask and other Web3 wallets via ethers.js
- **Email Authentication**: Privy integration for email-based login
- **Token Gating**: Smart contract integration to verify ERC-20 and NFT holdings
- **Access Control**: Course and session access based on token requirements

## Database Schema
- **Users**: Wallet addresses, email, display name, profile pictures, contact info, token balances, admin/instructor flags, completion statistics
- **Courses**: Content metadata, instructor info, token requirements, lesson/assignment counts
- **Enrollments**: User progress tracking, completion status, certificate issuance with proper foreign key relationships
- **Live Sessions**: Scheduled events with token-based access control and reminder integration
- **Reminders**: User-specific notifications with webhook integration for Make.com automation
- **Assignments & Forums**: Course-related content and discussions

## Token Integration
- **Contract Interaction**: Direct smart contract calls using ethers.js
- **Token Verification**: Real-time balance checking for THINK tokens and NFTs
- **Access Logic**: Flexible token requirements (ERC-20, NFT, or either)
- **Mock Data**: Fallback token balances for development/demo purposes

# External Dependencies

## Database
- **Supabase**: PostgreSQL database with real-time features
- **Connection**: WebSocket-based connection pooling via @neondatabase/serverless driver

## Blockchain Integration
- **Ethers.js**: Ethereum interaction library loaded via CDN
- **Public RPC**: Ethereum mainnet access through public endpoints
- **Smart Contracts**: THINK token (ERC-20) and THINK Agent Bundle NFT (ERC-721)

## Authentication Services
- **Privy**: Email authentication and wallet management (requires CSP configuration)
- **MetaMask**: Primary wallet connection method (fully functional)
- **Note**: Privy blocked in Replit due to CSP headers, works in Vercel deployment

## Video Conferencing
- **Daily.co**: Live session video integration (loaded via CDN)

## UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **React Hook Form**: Form state management
- **TanStack Query**: Server state synchronization

## Development Tools
- **Vite**: Build tool and development server
- **Replit**: Development environment integration
- **TypeScript**: Type safety across the stack