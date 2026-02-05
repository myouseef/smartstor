# TagerPro

## Overview

TagerPro is a multi-tenant SaaS marketing and promotion platform for merchants built with React Native/Expo for the mobile frontend and Express.js for the backend API. The platform enables merchants to manage products, capture and track leads, access AI-powered marketing tools, and view analytics dashboards. It supports both Arabic and English languages with full RTL/LTR layout support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54, using expo-router for file-based navigation
- **State Management**: TanStack React Query for server state, React Context for language/localization
- **UI Approach**: Custom components with LinearGradient, BlurView effects, and a dark theme color system
- **Navigation**: Tab-based navigation with 5 main screens (Dashboard, Products, Leads, AI Tools, Settings)
- **Fonts**: Cairo (Arabic) and Inter (English) loaded via expo-google-fonts for proper RTL/LTR typography

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **API Pattern**: RESTful endpoints under `/api/` prefix for products, leads, analytics, and AI features
- **Database ORM**: Drizzle ORM with PostgreSQL (Neon serverless)
- **AI Integration**: OpenAI API via Replit AI Integrations for generating descriptions, ad copy, price suggestions, and campaign ideas

### Data Models
- **Products**: Name (EN/AR), description, price, images, offers, status
- **Leads**: Contact info, source tracking, status pipeline (new → contacted → qualified → converted/lost)
- **Analytics**: Event tracking for visits and conversions
- **Chat**: Conversations and messages for AI chat features

### Key Design Decisions

1. **Monorepo Structure**: Shared schema between frontend and backend in `/shared/` directory enables type safety across the stack

2. **Language Context**: Centralized translation system with RTL detection that dynamically adjusts layouts and font families

3. **API Client Pattern**: Centralized `apiRequest` function and `getQueryFn` factory for consistent error handling and query caching

4. **Replit Integration Modules**: Pre-built modules in `/server/replit_integrations/` for audio, chat, image generation, and batch processing - designed for easy integration

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless Postgres via `@neondatabase/serverless` with WebSocket connections
- **Connection**: Configured via `DATABASE_URL` environment variable

### AI Services
- **OpenAI API**: Used for text generation (product descriptions, ad copy, pricing suggestions, campaign ideas)
- **Configuration**: `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
- **Models**: gpt-image-1 for image generation, standard chat models for text

### Expo Services
- expo-image-picker for product images
- expo-haptics for tactile feedback
- expo-location for location services
- expo-linear-gradient and expo-blur for UI effects

### Key NPM Packages
- `drizzle-orm` + `drizzle-zod`: Database ORM with Zod schema validation
- `@tanstack/react-query`: Server state management
- `react-native-reanimated` + `react-native-gesture-handler`: Animations and gestures
- `p-limit` + `p-retry`: Batch processing with rate limiting