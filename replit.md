# JSON Editor Application

## Overview

This is a full-stack JSON editor application built with React frontend and Express backend. The application allows users to import JSON files, visualize them as organized cards, and edit individual sections through a modal interface. It features a modern UI built with shadcn/ui components and Tailwind CSS, with PostgreSQL database integration using Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with hot module replacement in development

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Storage Pattern**: Repository pattern with in-memory storage (MemStorage) as default, designed for easy database integration
- **API Design**: RESTful endpoints for JSON file CRUD operations
- **Development**: Hot reload with tsx, production builds with esbuild

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema**: JSON files stored with metadata (id, name, content, size, lastModified) and parsed cards
- **Migration**: Drizzle Kit for schema migrations and database management
- **Connection**: Neon Database serverless driver for PostgreSQL connections

### Key Design Patterns
- **JSON Parsing**: Custom JsonParser class that breaks down JSON into manageable card-based components
- **Modal Editing**: Individual JSON sections can be edited in isolation through a modal interface
- **File Import**: Drag-and-drop file upload with JSON validation
- **Component Architecture**: Reusable UI components following shadcn/ui patterns
- **Type Safety**: Full TypeScript coverage with Zod schema validation

### API Structure
- `GET /api/json-files` - Retrieve all JSON files
- `GET /api/json-files/:id` - Get specific JSON file
- `POST /api/json-files` - Create new JSON file
- `PATCH /api/json-files/:id` - Update JSON file
- `DELETE /api/json-files/:id` - Delete JSON file

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL connection driver for serverless environments
- **drizzle-orm**: TypeScript ORM for database operations
- **drizzle-kit**: Database migration and schema management tool
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing

### UI and Styling
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating type-safe component variants
- **clsx**: Conditional className utility

### Development Tools
- **vite**: Fast build tool and development server
- **@vitejs/plugin-react**: React support for Vite
- **tsx**: TypeScript execution engine for Node.js
- **esbuild**: Fast JavaScript bundler for production builds

### Validation and Forms
- **zod**: TypeScript-first schema validation
- **react-hook-form**: Performant forms with minimal re-renders
- **@hookform/resolvers**: Validation resolver for react-hook-form

### Additional Features
- **date-fns**: Modern JavaScript date utility library
- **embla-carousel-react**: Carousel component for React
- **cmdk**: Command palette component
- **lucide-react**: Feather-inspired icon library