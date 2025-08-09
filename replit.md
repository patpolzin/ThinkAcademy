# Overview

EduDAO is a token-gated learning platform that combines blockchain technology with educational content delivery. The platform allows users to access courses and live sessions based on their token holdings (ERC-20 tokens or NFTs). It features a React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and integrating with Ethereum wallets for authentication and token verification.

# User Preferences

Preferred communication style: Simple, everyday language.
Platform branding: UTHINK with "U" highlighted in cyan color to represent university concept.
Color scheme: Cyan/teal primary colors with dark mode as default.
Authentication: Dual login system - MetaMask wallet connection and Privy email+assigned wallet.
UI: Single "Login" button that opens modal with both authentication options.

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
- **Users**: Wallet addresses, email, token balances, admin flags
- **Courses**: Content metadata, instructor info, token requirements
- **Enrollments**: User progress tracking, completion status
- **Live Sessions**: Scheduled events with token-based access control
- **Assignments & Forums**: Course-related content and discussions

## Token Integration
- **Contract Interaction**: Direct smart contract calls using ethers.js
- **Token Verification**: Real-time balance checking for THINK tokens and NFTs
- **Access Logic**: Flexible token requirements (ERC-20, NFT, or either)
- **Mock Data**: Fallback token balances for development/demo purposes

# External Dependencies

## Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: WebSocket-based connection pooling

## Blockchain Integration
- **Ethers.js**: Ethereum interaction library loaded via CDN
- **Public RPC**: Ethereum mainnet access through public endpoints
- **Smart Contracts**: THINK token (ERC-20) and THINK Agent Bundle NFT (ERC-721)

## Authentication Services
- **Privy**: Email authentication and wallet management
- **MetaMask**: Primary wallet connection method

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