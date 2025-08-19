# Building Assessment Platform

## Overview

A comprehensive green building assessment platform designed for GREDA Green Building Council certification tracking. The application provides sustainability evaluation, certification tracking, and environmental performance analytics for residential and commercial buildings. It supports multi-stakeholder workflows with role-based access for administrators, assessors, and clients, featuring comprehensive form management, media handling, and reporting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with dark mode theme and custom green color palette
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for client-side routing with UUID-based assessment URLs
- **Forms**: Multi-step form wizard with auto-save functionality every 30 seconds

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Custom session-based authentication with bcrypt password hashing
- **File Storage**: Local file system with multer for upload handling
- **Real-time**: WebSocket connections for live notifications and updates

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless for cloud hosting
- **Fallback**: In-memory storage for development without database connection
- **Schema Management**: Drizzle migrations with schema versioning
- **Core Tables**: users, assessments, assessment_sections, assessment_media, notifications, activity_logs, audit_logs

### Assessment System
- **Structure**: 8-section building assessment (Building Information, Site & Transport, Water Efficiency, Energy Efficiency, Indoor Environmental Quality, Materials & Resources, Waste & Pollution, Innovation)
- **Scoring**: Variable-based scoring system with configurable maximum values per assessment criterion
- **Media Support**: Image, video, audio, and document uploads with preview capabilities
- **Location Data**: GPS coordinates and address capture for location-specific assessments

### User Management & Security
- **Role-Based Access Control**: Three distinct roles (admin, assessor, client) with granular permissions
- **Domain-Based Routing**: Separate subdomains for different user roles in production
- **Subscription Management**: Tiered access control (free, basic, premium, enterprise)
- **Audit Trail**: Comprehensive activity logging and audit trails for compliance

### Notification & Communication
- **Real-time Notifications**: WebSocket-based instant notifications with priority levels
- **Email Integration**: Nodemailer for transactional emails and invitations
- **Activity Tracking**: Detailed logging of user actions and system events
- **Status Updates**: Assessment lifecycle notifications (draft, submitted, completed, locked)

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Primary cloud database service for production data persistence
- **Supabase**: Alternative PostgreSQL option for database hosting
- **PlanetScale**: MySQL alternative database option

### Authentication & Session Management
- **bcryptjs**: Password hashing and verification
- **express-session**: Session management with PostgreSQL session store
- **connect-pg-simple**: PostgreSQL session store integration

### File Handling & Media Processing
- **multer**: Multipart form data and file upload handling
- **qrcode**: QR code generation for assessment sharing
- **jspdf & html2canvas**: PDF report generation from HTML content
- **xlsx**: Excel file generation for data export

### Email & Communication
- **nodemailer**: SMTP email sending for notifications and invitations
- **@sendgrid/mail**: Alternative email service integration

### Real-time Features
- **ws (WebSocket)**: Real-time bidirectional communication
- **WebSocket Server**: Custom WebSocket management for user connections

### Development & Build Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundling for production builds

### UI & Visualization
- **@radix-ui/***: Accessible UI component primitives
- **lucide-react**: Icon library for consistent iconography
- **date-fns**: Date manipulation and formatting utilities
- **recharts**: Data visualization and charting library