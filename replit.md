# Overview

This is a comprehensive building assessment application for green building sustainability evaluation and certification tracking. The system enables assessors to conduct detailed sustainability assessments of buildings across multiple categories including site & transport, water efficiency, energy efficiency, indoor environmental quality, materials & resources, waste & pollution, and innovation. It provides role-based access for admins, assessors, and clients with features for assessment creation, media uploads, scoring, reporting, and collaboration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite build system
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Media Handling**: Custom components for image, video, audio, and file uploads with preview capabilities

## Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with express-session
- **File Handling**: Multer for multipart file uploads
- **WebSocket**: Real-time notifications using native WebSocket API

## Database Design
- **Primary Database**: PostgreSQL with Drizzle schema
- **Connection**: Neon PostgreSQL for cloud hosting
- **Tables**: Users, assessments, assessment sections, assessment media, notifications, activity logs, user invitations, audit logs
- **Session Storage**: PostgreSQL-backed session store for authentication

## Authentication & Authorization
- **Session Management**: Express-session with PostgreSQL store
- **Role-Based Access**: Three user roles (admin, assessor, client) with different permissions
- **Password Security**: bcryptjs for password hashing
- **Invitation System**: Token-based user invitations with expiration

## Assessment System
- **Multi-Section Forms**: 8 assessment sections with variable scoring
- **Draft Auto-Save**: Automatic form saving every 30 seconds
- **Media Support**: Image, video, audio, and document uploads per field
- **Scoring Engine**: Weighted scoring system with maximum values per variable
- **Status Workflow**: Draft → In Progress → Completed → Submitted states

## External Dependencies

- **Database**: Neon PostgreSQL cloud database service
- **Email**: Nodemailer for SMTP email delivery
- **File Processing**: Sharp for image processing, html2canvas for PDF generation
- **PDF Generation**: jsPDF for client-side PDF creation
- **Excel Export**: SheetJS (xlsx) for spreadsheet generation
- **QR Codes**: qrcode library for generating assessment QR codes
- **Charts**: Custom chart components for data visualization
- **Date Handling**: date-fns for date formatting and manipulation
- **WebSocket**: Native WebSocket for real-time notifications
- **Cloud Storage**: Local file system storage with plans for cloud migration