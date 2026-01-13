# Youth Service Philippines - System Documentation

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Features](#features)
5. [Authentication & Authorization](#authentication--authorization)
6. [Database Schema](#database-schema)
7. [API Structure](#api-structure)
8. [Setup & Installation](#setup--installation)
9. [Environment Variables](#environment-variables)
10. [Development](#development)
11. [Deployment](#deployment)
12. [Architecture Decisions](#architecture-decisions)

---

## Overview

**Youth Service Philippines (YSP)** is a modern web application that connects volunteers, chapters, and programs into a unified service portal. The system enables meaningful community action by providing a platform for:

- **Public Users**: Browse programs, chapters, and volunteer opportunities
- **Chapter Heads**: Manage volunteer opportunities for their specific chapter
- **Administrators**: Manage all content including programs, chapters, opportunities, and site settings

The application is built as a single-page application (SPA) with a React frontend and Supabase backend, featuring role-based access control and a content management system.

---

## Technology Stack

### Frontend
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.4** - Build tool and dev server
- **React Router DOM 7.11.0** - Client-side routing
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **GSAP 3.14.2** - Animation library
- **Three.js 0.182.0** - 3D graphics (for hero background)

### Backend & Services
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email/password)
  - Row Level Security (RLS)
  - Storage (for program images)

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - Type-aware linting rules

---

## Project Structure

```
youth-service-ph/
├── dist/                    # Build output
├── public/                  # Static assets
├── src/
│   ├── app/                 # App-level configuration
│   │   ├── providers.tsx    # React context providers
│   │   ├── router.tsx       # Route definitions
│   │   └── RouteError.tsx   # Error boundary component
│   ├── assets/              # Images and static files
│   ├── auth/                # Authentication system
│   │   ├── AuthProvider.tsx # Auth context & state management
│   │   ├── RequireRole.tsx  # Route protection component
│   │   ├── auth.types.ts    # Auth type definitions
│   │   └── auth.utils.ts    # Auth utility functions
│   ├── components/         # Reusable components
│   │   ├── cms/            # CMS-specific components
│   │   ├── dev/            # Development components
│   │   ├── layout/         # Layout components (Header, Footer)
│   │   ├── motion/         # Animation components
│   │   ├── three/          # Three.js components
│   │   └── ui/             # Base UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Core libraries & services
│   │   ├── admin.api.ts    # Admin API functions
│   │   ├── public.api.ts   # Public API functions
│   │   ├── profile.service.ts # Profile service
│   │   ├── storage.ts      # File upload utilities
│   │   ├── supabase.ts     # Supabase client
│   │   └── supabase.types.ts # Database type definitions
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Programs.tsx
│   │   ├── ProgramDetail.tsx
│   │   ├── MembershipChapter.tsx
│   │   ├── VolunteerOpportunities.tsx
│   │   ├── Contact.tsx
│   │   ├── SignIn.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── ChapterHeadDashboard.tsx
│   ├── styles/             # Global styles
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global CSS
├── package.json
├── vite.config.ts
├── tsconfig.json
└── eslint.config.js
```

---

## Features

### Public Features

1. **Home Page**
   - Hero section with animated background
   - Statistics display (projects, chapters, members)
   - Featured programs preview
   - Chapter network overview
   - Call-to-action sections

2. **Programs**
   - Browse all programs
   - Program detail pages
   - Image galleries
   - Program descriptions

3. **Chapters**
   - Chapter listings
   - Chapter information (location, contact details)
   - Chapter network visualization

4. **Volunteer Opportunities**
   - Browse all volunteer opportunities
   - Filter by chapter
   - View SDGs (Sustainable Development Goals) impacted
   - Contact information for sign-up

5. **Contact**
   - Contact form/information
   - Social media links

### Admin Features

The Admin Dashboard (`/admin`) provides full content management:

1. **Programs Management**
   - Create, read, update, delete programs
   - Upload program images to Supabase Storage
   - Manage program metadata

2. **Chapters Management**
   - Create, read, update, delete chapters
   - Manage chapter contact information
   - Set chapter locations

3. **Volunteer Opportunities Management**
   - Create, read, update, delete opportunities
   - Assign opportunities to chapters
   - Set event dates and SDGs

4. **Site Settings**
   - Update global statistics (projects count, chapters count, members count)
   - Manage contact information (email, Facebook, mobile)
   - Global site configuration

### Chapter Head Features

The Chapter Head Dashboard (`/chapter-head`) provides:

1. **Chapter-Scoped Opportunities**
   - Create volunteer opportunities for their chapter only
   - Edit/delete their chapter's opportunities
   - View filtered list of their chapter's opportunities

---

## Authentication & Authorization

### Authentication Flow

1. **Sign In**: Users sign in via Supabase Auth (email/password)
2. **Profile Lookup**: After authentication, the system fetches the user's profile from the `profiles` table
3. **Role Assignment**: The profile contains a `role` field that determines access level

### User Roles

- **`admin`**: Full access to all content management features
- **`chapter_head`**: Access to manage opportunities for their assigned chapter only
- **No role** (public): Read-only access to public pages

### Route Protection

Routes are protected using the `RequireRole` component:

```typescript
// Example from router.tsx
{
  path: "/admin",
  element: (
    <RequireRole role="admin">
      <AdminDashboard />
    </RequireRole>
  ),
}
```

### Profile Structure

```typescript
type Profile = {
  id: string;              // Matches Supabase auth.users.id
  role: "admin" | "chapter_head";
  chapter_id: string | null;  // Only set for chapter_head role
  created_at?: string;
};
```

### Access Control

- **Row Level Security (RLS)**: Supabase RLS policies enforce data access at the database level
- **Client-side checks**: `RequireRole` component prevents unauthorized route access
- **API-level validation**: Admin API functions require authenticated users with appropriate roles

---

## Database Schema

Based on the API structure, the database contains the following tables:

### `profiles`
Stores user profile information linked to Supabase Auth users.

```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'chapter_head')),
  chapter_id UUID REFERENCES chapters(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### `programs`
Stores program information displayed on public pages.

```sql
programs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### `chapters`
Stores chapter information for the network.

```sql
chapters (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### `volunteer_opportunities`
Stores volunteer opportunities created by admins or chapter heads.

```sql
volunteer_opportunities (
  id UUID PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  chapter_id UUID REFERENCES chapters(id),
  sdgs TEXT[] NOT NULL,  -- Array of SDG labels
  contact_details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### `volunteer_signups`
Stores volunteer sign-ups for opportunities.

```sql
volunteer_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_signup UNIQUE (opportunity_id, email)
)
```

### `site_settings`
Singleton table storing global site configuration.

```sql
site_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,  -- Ensures single row
  projects_count INTEGER DEFAULT 0,
  chapters_count INTEGER DEFAULT 0,
  members_count INTEGER DEFAULT 0,
  contact_email TEXT,
  contact_facebook TEXT,
  contact_mobile TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Storage Buckets

- **`program-images`**: Stores uploaded program images
  - Path format: `programs/{programId}.{ext}`

---

## API Structure

The application uses two API layers:

### Public API (`src/lib/public.api.ts`)

Functions for public-facing pages (no authentication required):

- `getSiteSettings()` - Get global site settings
- `listPrograms(limit?)` - List all programs
- `getProgramById(id)` - Get single program
- `listChapters(limit?)` - List all chapters
- `listVolunteerOpportunities(limit?)` - List all opportunities with chapter info
- `signUpForOpportunity(input)` - Sign up for a volunteer opportunity

### Admin API (`src/lib/admin.api.ts`)

Functions for authenticated admin users:

**Programs:**
- `adminListPrograms()` - List all programs
- `adminCreateProgram(input)` - Create new program
- `adminUpdateProgram(id, input)` - Update program
- `adminDeleteProgram(id)` - Delete program

**Chapters:**
- `adminListChapters()` - List all chapters
- `adminCreateChapter(input)` - Create new chapter
- `adminUpdateChapter(id, input)` - Update chapter
- `adminDeleteChapter(id)` - Delete chapter

**Opportunities:**
- `listOpportunities()` - List all opportunities
- `createOpportunity(input)` - Create new opportunity
- `updateOpportunity(id, input)` - Update opportunity
- `deleteOpportunity(id)` - Delete opportunity

**Site Settings:**
- `getSiteSettingsRow()` - Get site settings
- `updateSiteSettingsRow(input)` - Update site settings

### Storage API (`src/lib/storage.ts`)

- `uploadProgramImage(file, programId)` - Upload program image to Supabase Storage

### Profile Service (`src/lib/profile.service.ts`)

- `fetchMyProfile()` - Fetch current user's profile

---

## Setup & Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase account** and project
- **Git** (for version control)

### Installation Steps

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Note your project URL and anon key

4. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Set up the database:**
   - Run SQL migrations in Supabase SQL Editor to create tables
   - Enable Row Level Security (RLS) policies
   - Create storage bucket `program-images` with public access

6. **Start the development server:**
   ```bash
   npm run dev
   ```

7. **Access the application:**
   - Open `http://localhost:5173` (or the port shown in terminal)

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Environment File Location

- **Development**: `.env.local` (git-ignored)
- **Production**: Set in your hosting platform's environment variable settings

---

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Development Workflow

1. **Start the dev server**: `npm run dev`
2. **Make changes**: Edit files in `src/`
3. **Hot Module Replacement**: Changes reflect automatically
4. **Type checking**: TypeScript errors shown in terminal/editor
5. **Linting**: Run `npm run lint` to check code quality

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured with React and TypeScript rules
- **Formatting**: Follow existing code style (no formatter configured)

### Key Development Patterns

1. **Lazy Loading**: Pages are lazy-loaded for code splitting
2. **Error Boundaries**: Route-level error handling
3. **Loading States**: Suspense boundaries for async components
4. **Form Handling**: Controlled components with local state
5. **API Calls**: Async/await with error handling

---

## Deployment

### Build Process

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Output**: The `dist/` directory contains the production build

### Deployment Options

#### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Netlify

1. Connect repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables

#### Other Static Hosting

Upload the contents of `dist/` to any static hosting service:
- GitHub Pages
- AWS S3 + CloudFront
- Azure Static Web Apps
- Firebase Hosting

### Environment Variables in Production

Ensure all environment variables are set in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Post-Deployment Checklist

- [ ] Verify environment variables are set
- [ ] Test authentication flow
- [ ] Verify Supabase RLS policies are active
- [ ] Test image uploads (if using storage)
- [ ] Check console for errors
- [ ] Test all user roles (admin, chapter_head, public)

---

## Architecture Decisions

### Why Supabase?

- **Rapid Development**: Backend infrastructure ready out of the box
- **Row Level Security**: Database-level access control
- **Real-time Capabilities**: Can be extended for real-time features
- **Storage**: Built-in file storage for images
- **Type Safety**: Generated TypeScript types from database schema

### Why React Router?

- **Client-side Routing**: Fast navigation without page reloads
- **Code Splitting**: Lazy loading for better performance
- **Protected Routes**: Easy implementation of role-based access

### Why Tailwind CSS?

- **Utility-First**: Rapid UI development
- **Consistency**: Design system enforced through utilities
- **Performance**: PurgeCSS removes unused styles in production

### Why GSAP?

- **Performance**: Hardware-accelerated animations
- **Flexibility**: Complex animation sequences
- **Reveal Animations**: Scroll-triggered animations for better UX

### Security Considerations

1. **Row Level Security (RLS)**: Primary security mechanism at database level
2. **Client-side Checks**: `RequireRole` prevents unauthorized UI access
3. **Environment Variables**: Sensitive keys stored in environment, not code
4. **Type Safety**: TypeScript prevents many runtime errors
5. **No Direct Database Access**: All access through Supabase client with RLS

### Performance Optimizations

1. **Code Splitting**: Lazy-loaded routes reduce initial bundle size
2. **Image Optimization**: Lazy loading for images
3. **Suspense Boundaries**: Better loading states
4. **Memoization**: `useMemo` for expensive computations
5. **Efficient Re-renders**: React 19 optimizations

---

## Troubleshooting

### Common Issues

**Issue**: "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
- **Solution**: Ensure `.env.local` file exists with correct variables

**Issue**: Authentication not working
- **Solution**: Check Supabase project settings, verify RLS policies

**Issue**: Images not uploading
- **Solution**: Verify storage bucket exists and has correct permissions

**Issue**: Type errors after database changes
- **Solution**: Regenerate Supabase types: `npx supabase gen types typescript --project-id <project-id> > src/lib/supabase.types.ts`

**Issue**: Build fails
- **Solution**: Run `npm run lint` to check for errors, ensure all dependencies are installed

---

## Future Enhancements

Potential improvements and features:

1. **User Registration**: Public user registration flow
2. **Email Notifications**: Notify chapter heads of new opportunities
3. **Search & Filters**: Advanced filtering for programs and opportunities
4. **User Profiles**: Public user profiles and volunteer history
5. **Analytics**: Track page views and user engagement
6. **Mobile App**: React Native app for mobile access
7. **Real-time Updates**: WebSocket integration for live updates
8. **Multi-language Support**: i18n for multiple languages

---

## Support & Contact

For questions or issues:
- Check the codebase documentation
- Review Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review React Router documentation: [reactrouter.com](https://reactrouter.com)

---

**Last Updated**: 2024
**Version**: 0.0.0
