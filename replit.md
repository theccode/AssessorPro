# GREDA Green Building Assessment Platform

## Overview

GREDA-GBC Assessor Pro is a comprehensive sustainability evaluation platform for green building projects. The application provides tools for creating, managing, and analyzing building assessments based on the GREDA Green Building Council (GBC) framework. It supports multi-role user management (Admin, Assessor, Client), detailed scoring systems across multiple sustainability categories, and comprehensive reporting capabilities for residential buildings during design and construction phases.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom green-themed design system
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Authentication**: Dual system supporting both Replit Auth and custom email/password authentication
- **Session Management**: Express-session with PostgreSQL store
- **API Design**: RESTful API with consistent error handling and middleware patterns

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Comprehensive relational schema with the following core entities:
  - Users (multi-role: admin/assessor/client with subscription tiers)
  - Assessments (building evaluation records with UUID public IDs)
  - Assessment Sections (scored categories like Water Efficiency, Energy Efficiency)
  - Assessment Media (file uploads with metadata)
  - Notifications (real-time user communications)
  - Activity Logs (audit trail for user actions)
  - User Invitations (admin-managed user onboarding)

### Assessment Framework
- **Multi-Section Structure**: 8 standardized assessment categories
  - Building Information (non-scored metadata)
  - Site and Transport
  - Water Efficiency
  - Energy Efficiency
  - Indoor Environmental Quality
  - Materials & Resources
  - Waste & Pollution
  - Innovation
- **Scoring System**: Variable-based scoring with defined maximum values per criterion
- **Media Support**: Comprehensive file upload system supporting images, videos, audio, and documents
- **Draft Management**: Auto-save functionality with section-by-section progress tracking

### Authentication & Authorization
- **Multi-Provider Auth**: Supports both Replit SSO and traditional email/password
- **Role-Based Access**: Three-tier system (Admin/Assessor/Client) with feature-based permissions
- **Domain Routing**: Production deployment supports role-specific subdomains
- **Session Security**: Secure session management with configurable TTL

### Real-Time Features
- **WebSocket Integration**: Real-time notifications and live updates
- **Activity Tracking**: Comprehensive logging of user actions and system events
- **Notification System**: Multi-channel notifications (in-app, email) with priority levels

### File Management
- **Media Pipeline**: Structured file organization by assessment and section
- **Multiple Formats**: Support for images (JPG/PNG), videos (MP4), audio (MP3), documents (PDF/DOC)
- **Storage Strategy**: Local filesystem with planned cloud storage migration
- **Validation**: File type, size, and integrity validation

### Reporting & Analytics
- **PDF Generation**: Dynamic report generation using jsPDF and html2canvas
- **Excel Export**: Structured data export using XLSX library
- **QR Code Integration**: Assessment sharing via QR codes for public access
- **Progress Tracking**: Visual progress indicators and completion analytics

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (currently configured for Neon/Supabase cloud providers)
- **Email Service**: Nodemailer with SMTP configuration for notifications and invitations
- **File Storage**: Local filesystem (migration path to cloud storage available)

### Authentication Providers
- **Replit Auth**: OpenID Connect integration for Replit-hosted deployments
- **Custom Auth**: bcryptjs for password hashing and local authentication

### UI & Styling Libraries
- **Radix UI**: Comprehensive component primitives (@radix-ui/react-*)
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Lucide React**: Icon library for consistent iconography

### Development & Build Tools
- **Vite**: Frontend build tool with React plugin and error overlay
- **TypeScript**: Type safety across frontend and backend
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Production backend bundling

### Document & Media Processing
- **jsPDF**: Client-side PDF generation for assessment reports
- **html2canvas**: HTML to canvas conversion for PDF embedding
- **XLSX**: Excel file generation and export functionality
- **QRCode**: QR code generation for assessment sharing
- **Multer**: Multipart form data handling for file uploads

### Real-Time & Communication
- **WebSocket (ws)**: Real-time bidirectional communication
- **Nodemailer**: Email delivery system with template support
- **Express Session**: Session management with PostgreSQL persistence