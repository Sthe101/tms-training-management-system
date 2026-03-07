# TMS - Training Management System MVP

## 1. Product Scope

### Roles
- **Admin**: System configuration + master data management
- **Manager**: Create/manage training requests for their team
- **Clerk**: Process requests + update employee training progress

### Training Statuses (Only 3)
- Required
- In Progress
- Completed

---

## 2. Features by Role

### 2.1 Authentication
- Login page with role selector (Admin | Manager | Clerk)
- Email + Password authentication
- Role-based redirect to appropriate dashboard

### 2.2 Admin Portal

**Navigation**: Dashboard | Divisions | Employees | Trainings *(Reports & Analytics removed until those slices are built)*

**Divisions**
- View divisions as cards (name, department count, preview list) — click `›` to open detail page
- Add/Delete Division
- Division Details page (`/admin/divisions/[id]`):
  - Departments: list + add (name only) + rename + delete
  - Applicable Trainings: assign from dropdown (unassigned only) + remove
  - Managers: promote existing employee to manager + demote (employee stays in directory)
  - Employees: add employee (division pre-filled) + remove

**Employees Directory** (`/admin/employees`)
- Summary cards: Total / Active / Inactive
- Search by name or employee number
- Filters: division → cascading department → status
- Table listing with edit + delete actions
- Add Employee modal (Full Name, Employee #, Division → Department cascade)
- Edit Employee modal (same fields + Status toggle)

**Trainings** (`/admin/trainings`)
- List training categories with edit + delete actions
- Add Training modal (name only)
- Edit Training modal (pre-filled name)

**Reports + Analytics**
- MVP placeholder pages with navigation access

### 2.3 Manager Portal

**Dashboard**
- Summary cards: Total Employees, Active Requests, Completed Requests, Completion Rate
- Training Requests list as cards
- Team Training Status table

**Actions**
- Add Employee modal
- New Training Request modal
- Edit Training Request modal

### 2.4 Clerk Portal

**Dashboard**
- Summary cards: Required / In Progress / Completed
- Incoming requests list

**Request Details**
- Request header info
- Employee list with status and actions
- Edit Employee Training Status modal

---

## 3. Tech Stack

### Repository Structure (Monorepo)
```
tms-training-management-system/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types/constants
├── package.json      # npm workspaces
└── turbo.json        # Turborepo config
```

### Frontend
- Next.js (React) + TypeScript
- Tailwind CSS
- shadcn/ui component library

### Backend
- Node.js + NestJS + TypeScript
- Prisma ORM
- PostgreSQL (Supabase)

### Dev Tools
- npm workspaces + Turborepo
- ESLint + Prettier
- Husky + lint-staged

### Testing
- Frontend: Playwright (E2E) + React Testing Library
- Backend: Jest + Supertest

---

## 4. Database Schema

### Implemented Models
- **User**: id, name, email, password, role (ADMIN|MANAGER|CLERK), createdAt, updatedAt
- **Division**: id, name, createdAt → has many Department, DivisionTraining, DivisionManager
- **Department**: id, name, divisionId → has many Employee; has one DivisionManager (optional)
- **Employee**: id, name, employeeNumber (unique), email?, departmentId, status (ACTIVE|INACTIVE), role (EMPLOYEE|MANAGER), createdAt, updatedAt → has one DivisionManager? (if promoted)
- **TrainingCategory**: id, name (unique), createdAt → has many DivisionTraining
- **DivisionTraining**: divisionId + trainingCategoryId (composite PK) — M:M between Division and TrainingCategory
- **DivisionManager**: id, divisionId, departmentId (unique), employeeId (unique), assignedAt — enforces one manager per department and one assignment per employee

### Pending Models (future slices)
- **TrainingRequest**: id, trainingCategoryId, managerId (DivisionManager), dueDate, status, createdAt
- **RequestEmployee**: requestId, employeeId, status, dueDate

---

## 5. UI Components (Reusable)

### Built & In Use
| Component | Path | Description |
|-----------|------|-------------|
| `<Modal>` | `src/components/ui/modal.tsx` | Backdrop + X close + title + cyan subtitle |
| `<ConfirmDialog>` | `src/components/ui/confirm-dialog.tsx` | Wraps Modal, AlertTriangle, destructive/default variant |
| `<Button>` | shadcn/ui | Primary dark blue `bg-[#0f3460]`, outline, destructive variants |
| `<Input>` | shadcn/ui | Standard text input |
| `<Label>` | shadcn/ui | Form label |
| `<Select>` + sub-components | shadcn/ui | Radix UI select dropdown |

### Planned (future slices)
| Component | Description |
|-----------|-------------|
| StatusBadge | Required/In Progress/Completed + Active/Inactive |
| RequestCard | Training request card UI |
| EmployeeSelectList | Checkbox list for requests |

### Responsive Design Requirements

All features must be fully responsive across breakpoints:

| Breakpoint | Width | Target Devices |
|------------|-------|----------------|
| Mobile | < 640px | Phones |
| Tablet | 640px - 1024px | Tablets, small laptops |
| Desktop | > 1024px | Laptops, desktops |

**Responsive Patterns:**
- **Navigation**: Collapsible sidebar on mobile (hamburger menu)
- **Cards**: Single column on mobile, grid on tablet/desktop
- **Tables**: Horizontal scroll or card view on mobile
- **Modals**: Full-screen on mobile, centered dialog on desktop
- **Forms**: Stacked fields on mobile, inline where appropriate on desktop
- **Buttons**: Full-width on mobile, auto-width on desktop

**Testing Checklist (per feature):**
- [ ] Mobile portrait (375px)
- [ ] Mobile landscape (667px)
- [ ] Tablet (768px)
- [ ] Desktop (1280px)
- [ ] Large desktop (1920px)

---

## 6. Security Requirements

### Authentication
- bcrypt password hashing
- HTTP-only cookies for JWT storage
- Session expiry + refresh

### Authorization (RBAC)
- Every endpoint gated by role
- Scope enforcement (managers only see their team)

### Protections
- Rate limiting on login
- Helmet security headers
- Strict CORS policy
- CSRF protection
- Audit logging for sensitive actions
- Input validation with zod/class-validator

---

## 7. Implementation Slices

| Slice | Feature | Status |
|-------|---------|--------|
| 0 | Project Foundation Setup | Complete |
| 1 | Authentication System | Complete |
| 2 | Admin - Divisions Management | Complete |
| 3 | Admin - Division Detail Page | Complete |
| 4 | Admin - Training Categories | Complete |
| 5 | Admin - Division Training Assignment | Complete (part of Slice 3) |
| 6 | Admin - Employees Directory | Complete |
| 7 | Admin - Manager Assignment | Complete (part of Slice 3) |
| 8 | Manager - Dashboard & Team View | Next |
| 9 | Manager - Training Requests CRUD | Pending |
| 10 | Manager - Add Employee | Pending |
| 11 | Clerk - Dashboard & Incoming Requests | Pending |
| 12 | Clerk - Request Details & Status Update | Pending |
| 13 | Admin - Reports & Analytics Pages | Pending |
| 14 | Security Hardening | Pending |
| 15 | Polish & Testing | Pending |

---

## 8. Progress Tracking

### Slice 0: Project Foundation Setup - COMPLETE
- [x] Initialize npm workspaces monorepo
- [x] Configure Turborepo
- [x] Setup Next.js app with shadcn/ui config
- [x] Setup NestJS API with Prisma
- [x] Create Supabase project
- [ ] Prisma schema (building incrementally)
- [ ] Seed data (building incrementally)

### Slice 1: Authentication System - COMPLETE
- [x] Add User model to Prisma schema
- [x] Create auth module (login/register endpoints)
- [x] Build login page UI (from screenshot)
- [x] Build signup page UI (from screenshot)
- [x] Implement role-based redirect

### Slice 2: Admin Divisions Management - COMPLETE
- [x] Division, Department models in Prisma schema
- [x] GET/POST/DELETE /divisions, POST/PATCH/DELETE /divisions/:id/departments
- [x] Admin layout (top navbar, navlinks, useAuth for name/logout)
- [x] Divisions page — cards grid, Add Division modal, Add Department modal, delete with ConfirmDialog

### Slice 3: Admin Division Detail Page - COMPLETE
- [x] DivisionTraining, DivisionManager models in Prisma schema
- [x] GET /divisions/:id (full detail — departments, trainings, managers, employees)
- [x] POST/DELETE /divisions/:id/trainings — assign/unassign training categories
- [x] POST/DELETE /divisions/:id/managers — promote/demote employee as manager via DivisionManager
- [x] Division detail page — 4 panels: Departments, Applicable Trainings, Managers, Employees
- [x] ChevronRight on division cards navigates to detail page

### Slice 4: Admin Training Categories - COMPLETE
- [x] TrainingCategory model in Prisma schema
- [x] GET/POST/PATCH/DELETE /trainings
- [x] Trainings page — table list, Add modal, Edit modal, delete with ConfirmDialog

### Slice 6: Admin Employees Directory - COMPLETE
- [x] Employee model (with status, role, email) in Prisma schema
- [x] GET (search + filters) /POST/PATCH/DELETE /employees
- [x] Employees page — stat cards (Total/Active/Inactive), filters bar, table, Add modal, Edit modal
- [x] Input validation on all DTOs + frontend (lib/validation.ts)

### Next: Slice 8 - Manager Portal (Dashboard & Team View)

---

## 9. Build Guidelines

- Build **incrementally from screenshots** — do not add features, UI elements, or functionality not shown in the reference screenshots unless strictly necessary for the feature to function.
- Each piece of working functionality gets its **own small commit** before moving to the next.
- Follow the **implementation slices** order; do not skip ahead.
- Reuse existing UI components (shadcn/ui) before creating new ones.
- All new pages must follow the **responsive requirements** in Section 5.

### Component & Code Reuse (apply to every new feature)

- **Always reuse existing components** before creating new ones. Check these first:
  - `<Modal>` — all modal dialogs (`src/components/ui/modal.tsx`)
  - `<ConfirmDialog>` — all destructive confirmations (`src/components/ui/confirm-dialog.tsx`)
  - shadcn/ui: `<Button>`, `<Input>`, `<Label>`, `<Select>` and its sub-components
  - `useToast()` — all user feedback
  - `useAuth()` — current user access
- **Reuse existing API endpoints** where possible — e.g. adding an employee from a division detail page reuses `POST /api/employees`, not a new endpoint.
- **Reuse `lib/validation.ts`** utilities (`sanitize`, `onSanitizedKeyDown`, `rules`, `messages`) in every form. Do not duplicate validation logic.
- **Do not recreate layout or nav** — the admin/manager/clerk layouts are already built; new pages just provide their content.
- Only create a new component or utility if it is reused in 2+ places or is too complex to inline.

### Notifications & Error Handling (apply to every new feature)

- **Never** use `window.alert()`, `window.confirm()`, or inline `{error && <p>}` patterns.
- Use `useToast()` from `src/context/toast-context.tsx` for all feedback:
  - `toast.success(msg)` — operation completed successfully (green)
  - `toast.error(msg)` — operation failed, API error, network error (red)
  - `toast.warning(msg)` — non-blocking warnings (amber)
  - `toast.info(msg)` — informational messages (cyan)
- Use `<ConfirmDialog>` from `src/components/ui/confirm-dialog.tsx` for all destructive confirmations (delete, deactivate, etc.).
- **Always handle these cases** in every API call:
  - Success → `toast.success()`
  - Known API error (e.g. conflict, not found) → `toast.error(err.message)`
  - Unknown/network error → `toast.error('Something went wrong. Please try again.')`
  - Loading state on fetch → show skeleton or "Loading..." text
  - Empty state → show a helpful empty state message

### Employee & Manager Model

- **An Employee and a Manager are the same entity** — there is no separate `Manager` model.
- The `Employee` model has a `role` field: `EMPLOYEE` (default) or `MANAGER`.
- The auth `User` model (ADMIN/MANAGER/CLERK) is separate from the `Employee` directory model. A User with role MANAGER will be linked to an Employee record in a future slice.
- The `Employee` model owns the `departmentId` relation, and Department cascades from Division.
- Employees have an optional `email` field used to identify and contact managers.

### Manager Assignment Logic (`DivisionManager` join table)

- Promoting to manager is done via the **Division Detail page** — select an existing `EMPLOYEE` from that division and a department they will manage.
- This creates a `DivisionManager` record and sets `Employee.role = MANAGER` in a single transaction.
- **`DivisionManager` enforces:**
  - `employeeId @unique` — one employee can only be a manager in one assignment at a time
  - `departmentId @unique` — each department can have at most one manager
  - Cascade deletes from both Division and Employee
- Removing a manager deletes the `DivisionManager` record and demotes `Employee.role` back to `EMPLOYEE`. The employee stays in the directory.
- The **Employees panel** on the Division Detail page only shows `role = EMPLOYEE` records — managers are shown exclusively in the Managers panel.
- **Endpoints:**
  - `POST /divisions/:id/managers` — `{ employeeId, departmentId }` — promote employee to manager
  - `DELETE /divisions/:id/managers/:employeeId` — demote manager back to employee
- **When building features that reference managers**, query via `DivisionManager` (include `employee` + `department`) rather than filtering `Employee.role = MANAGER` directly, as `DivisionManager` holds the authoritative department assignment.

### Validation & Input Security (apply to every new feature)

**Backend (DTOs — enforced by global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`):**
- All string fields must use `@Transform` to trim whitespace and strip HTML tags/injection chars: `value.trim().replace(/<[^>]*>/g, '').replace(/[<>{}]/g, '')`
- **Person/place names** (employee name, user name): `@MinLength(2)` `@MaxLength(100)` `@Matches(/^[a-zA-Z\s\-'.]+$/)`
- **Org names** (division, department, training category): `@MinLength(2)` `@MaxLength(100)` `@Matches(/^[a-zA-Z0-9\s\-&'.()]+$/)`
- **Employee number**: uppercase-normalize via `@Transform`, `@MinLength(2)` `@MaxLength(20)` `@Matches(/^[A-Z0-9][A-Z0-9\-]*$/)`
- **Email fields**: `@IsEmail()` + `@MaxLength(254)` + lowercase-normalize via `@Transform`
- **Passwords**: `@MinLength(8)` `@MaxLength(72)` (bcrypt limit) `@Matches` for complexity (upper + lower + digit)
- All enums use `@IsEnum()` with a descriptive message

**Frontend (UX layer — `apps/web/src/lib/validation.ts`):**
- Import `sanitize`, `onSanitizedKeyDown`, `rules`, `messages` from `@/lib/validation`
- Apply `onChange={(e) => { const v = sanitize(e.target.value); ... }}` on all text inputs
- Apply `onKeyDown={onSanitizedKeyDown}` on all text inputs (blocks `< > { } \``)
- Apply `maxLength={N}` on all inputs matching backend limits
- Validate all required fields **before submit** and display inline `<p className="text-xs text-red-500">` error messages
- Clear errors on modal close; re-validate live once an error has been shown (on each change)
- Never rely solely on `required` HTML attribute — always validate programmatically

### Auth Requirements (apply to every new feature)

- **Route protection**: All `/admin/*`, `/manager/*`, `/clerk/*` routes are protected by Next.js middleware (`src/middleware.ts`). Unauthenticated users are redirected to `/login`. This is already in place — do not remove or bypass it.
- **Auth context**: Every page/component that needs the current user must use the `useAuth()` hook from `src/context/auth-context.tsx`. Do **not** call `api.auth.me()` directly in individual components.
- **Role-specific layouts**: Each role layout (`admin/layout.tsx`, `manager/layout.tsx`, `clerk/layout.tsx`) uses `useAuth()` to display the user's name and provide a logout button.
- **API protection**: Every backend endpoint must be guarded with `JwtAuthGuard` + `RolesGuard` and the appropriate `@Roles()` decorator.

---

## 10. API Endpoint Reference

### Auth (`/api/auth`)
| Method | Path | Guard | Body |
|--------|------|-------|------|
| POST | /auth/login | public | `{ email, password, role }` |
| POST | /auth/register | public | `{ name, email, password, role }` |
| POST | /auth/logout | public | — |
| GET | /auth/me | JWT | — |

### Divisions (`/api/divisions`) — ADMIN only
| Method | Path | Body |
|--------|------|------|
| GET | /divisions | — |
| POST | /divisions | `{ name }` |
| DELETE | /divisions/:id | — |
| GET | /divisions/:id | — |
| POST | /divisions/:id/departments | `{ name }` |
| PATCH | /divisions/:id/departments/:deptId | `{ name }` |
| DELETE | /divisions/:id/departments/:deptId | — |
| POST | /divisions/:id/trainings | `{ trainingCategoryId }` |
| DELETE | /divisions/:id/trainings/:trainingCategoryId | — |
| POST | /divisions/:id/managers | `{ employeeId, departmentId }` |
| DELETE | /divisions/:id/managers/:employeeId | — |

### Trainings (`/api/trainings`) — ADMIN only
| Method | Path | Body |
|--------|------|------|
| GET | /trainings | — |
| POST | /trainings | `{ name }` |
| PATCH | /trainings/:id | `{ name }` |
| DELETE | /trainings/:id | — |

### Employees (`/api/employees`) — ADMIN only
| Method | Path | Body / Query |
|--------|------|------|
| GET | /employees | `?search&divisionId&departmentId&status` → returns `{ employees, stats }` |
| POST | /employees | `{ name, employeeNumber, departmentId }` |
| PATCH | /employees/:id | `{ name?, employeeNumber?, departmentId?, status? }` |
| DELETE | /employees/:id | — |

### Key API Response Patterns
- All endpoints return `{ success: true, data: ... }` or `{ success: true, employees: [...], stats: {...} }`
- Errors return NestJS default `{ statusCode, message, error }` format
- All requests use `credentials: 'include'` (HTTP-only cookie auth)
- API base URL: `NEXT_PUBLIC_API_URL` env var (default `http://localhost:3001`)

## 11. Frontend Architecture

### Key Files
| File | Purpose |
|------|---------|
| `src/middleware.ts` | Route protection — redirects unauthenticated to /login |
| `src/context/auth-context.tsx` | `useAuth()` — current user, logout |
| `src/context/toast-context.tsx` | `useToast()` — success/error/info/warning toasts |
| `src/lib/api.ts` | Typed API client — all fetch calls go through here |
| `src/lib/validation.ts` | `sanitize`, `onSanitizedKeyDown`, `rules`, `messages` |
| `src/components/ui/modal.tsx` | Reusable modal with backdrop + close button |
| `src/components/ui/confirm-dialog.tsx` | Destructive action confirmation |

### Colour Scheme
| Token | Value | Usage |
|-------|-------|-------|
| Primary cyan | `#0891b2` | Links, active states, employee numbers, info toasts |
| Dark blue | `#0f3460` | Primary buttons |
| Background | `#f1f5f9` | Page background |
| Light blue bg | `#e0f2fe` | Icon backgrounds |
| Indigo | `#6366f1` | Admin Portal badge |

### useCallback / useEffect Pattern
All data-fetch functions use `useCallback` with `[]` deps (toast ref excluded) + `// eslint-disable-next-line react-hooks/exhaustive-deps` to avoid stale-closure infinite loops. The `ToastProvider` value is wrapped in `useMemo` for the same reason.

### Schema Changes
Use `npx prisma db push` (NOT `migrate dev`) — the terminal is non-interactive and `migrate dev` requires prompts.

## 12. Screenshot Reference Log

| Date | Feature | Screenshot |
|------|---------|------------|
| 2026-03-05 | Login Page | Screenshot 2026-03-05 130018.png |
| 2026-03-05 | Signup Page | Screenshot 2026-03-05 143539.png |
| 2026-03-07 | Admin Divisions Page | Screenshot 2026-03-07 101313.png |
| 2026-03-07 | Admin Add Division Modal | Screenshot 2026-03-07 101357.png |
| 2026-03-07 | Admin Add Department Modal | Screenshot 2026-03-07 101413.png |
| 2026-03-07 | Admin Division Detail Page | Screenshot 2026-03-07 125052.png |
| 2026-03-07 | Division Detail - Add Department Modal | Screenshot 2026-03-07 125106.png |
| 2026-03-07 | Division Detail - Assign Training Modal | Screenshot 2026-03-07 125133.png |
| 2026-03-07 | Division Detail - Add Manager Modal | Screenshot 2026-03-07 125156.png |
| 2026-03-07 | Division Detail - Add Employee Modal | Screenshot 2026-03-07 125217.png |
