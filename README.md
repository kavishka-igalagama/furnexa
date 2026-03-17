# Furnexa

Furnexa is a full-stack interior design studio web application where users can:

- Create room layouts in a 2D planning canvas.
- Convert and preview layouts in a 3D viewer.
- Apply themes, colors, scaling, and furniture customizations.
- Save, edit, and manage room designs securely.
- Use role-based access (Designer/Admin) with dedicated admin CRUD tools.

## Project Highlights

- Full-stack Next.js (App Router) application.
- MongoDB database via Prisma.
- NextAuth credential authentication with role-aware sessions.
- Admin panels for furniture catalog and room templates.
- 2D design canvas built with React Konva.
- 3D visualization built with Three.js.
- Input validation with Zod and rate-limited auth endpoints.
- Unit tests for auth logic with Vitest.

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- 2D Engine: Konva, React Konva
- 3D Engine: Three.js
- Animation/UI: Framer Motion, Lucide Icons, Sonner
- Auth: NextAuth (Credentials), bcryptjs
- Backend/Data: Next.js API Routes, Prisma ORM, MongoDB
- Validation: Zod
- Testing: Vitest

## Main Features

### User-facing

- Landing page with feature walkthrough and gallery.
- Sign up/login with secure password validation.
- Designer workspace:
  - Room dimensions and style settings
  - Drag/drop furniture arrangement in 2D
  - Resize, rotate, recolor, and delete furniture items
  - Undo/redo workflow
  - Save and update designs
- 3D view page for immersive design preview.

### Admin-facing

- Protected admin dashboard.
- Furniture catalog management (create/read/update/delete).
- Room template management (create/read/update/delete).

## Repository Structure

```text
furnexa/
|- prisma/
|  |- schema.prisma
|- public/
|  |- assets/
|  |  |- 3d-models/
|  |  |- floor-textures/
|- scripts/
|  |- reset-user-password.mjs
|- src/
|  |- app/
|  |  |- (root)/
|  |  |  |- design/
|  |  |  |- 3d-view/
|  |  |  |- admin/
|  |  |- api/
|  |  |  |- auth/
|  |  |  |- designs/
|  |  |  |- furniture-catalog/
|  |  |  |- room-templates/
|  |- components/
|  |- context/
|  |- hooks/
|  |- lib/
|  |- data/
|  |- types/
|- tests/
|  |- auth/
|- README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- MongoDB database (local or cloud)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Run production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest tests
- `npm run prisma` - Prisma CLI passthrough
- `npm run prisma:generate` - Generate Prisma client
- `npm run reset:password -- --email "user@example.com" --password "NewPassword123!"` - Reset user password
- `npm run reset:password -- --email "admin@example.com" --password "AdminPass123!" --make-admin` - Reset password and set admin role

## API Summary

- `POST /api/auth/register` - Register new user (rate-limited, validated)
- `GET /api/designs` - List current user's designs (admin can see all)
- `POST /api/designs` - Create design
- `GET /api/furniture-catalog` - Read furniture items
- `POST /api/furniture-catalog` - Create furniture item (admin only)
- `GET /api/room-templates` - Read room templates
- `POST /api/room-templates` - Create room template (admin only)

## Authentication and Authorization

- Credentials-based sign-in via NextAuth.
- Passwords are hashed with bcrypt.
- Session carries role information (`USER`, `ADMIN`).
- Admin-only APIs/pages are protected by server-side checks.

## Database Model Overview

Main Prisma models:

- `User`
- `RoomDesign`
- `CatalogFurnitureItem`
- `CatalogRoomTemplate`
- NextAuth support models (`Account`, `Session`, `VerificationToken`)

Database provider: MongoDB

## Testing

Run tests:

```bash
npm run test
```

Current test coverage focus:

- Authentication options and behavior
- Registration route validation and edge cases
