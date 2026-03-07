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

**Navigation**: Dashboard | Divisions | Employees | Trainings | Reports | Analytics

**Divisions**
- View divisions as cards (name, department count, preview list)
- Add/Delete Division
- Division Details page:
  - Departments: list + add + delete
  - Applicable Trainings: assign/remove training categories
  - Managers: add/remove manager
  - Employees: add/remove employee

**Employees Directory**
- Summary cards: Total / Active / Inactive
- Search by name or employee number
- Filters: division, department, status
- Table listing with delete action
- Add Employee modal

**Trainings**
- List training categories (name + target employees)
- Add/Delete training category

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

### Core Entities
- **User**: id, email, password, role, createdAt, updatedAt
- **Division**: id, name, createdAt
- **Department**: id, name, divisionId
- **Employee**: id, name, employeeNumber, departmentId, status, managerId
- **TrainingCategory**: id, name, targetEmployees
- **DivisionTraining**: divisionId, trainingCategoryId (M:M)
- **TrainingRequest**: id, trainingCategoryId, managerId, dueDate, status, createdAt
- **RequestEmployee**: requestId, employeeId, status, dueDate
- **Manager**: id, userId, departmentId

---

## 5. UI Components (Reusable)

| Component | Description |
|-----------|-------------|
| DashboardStatCard | Metric card with label |
| PageHeader | Title + action buttons |
| DataTable | Sortable table shell |
| StatusBadge | Required/In Progress/Completed + Active/Inactive |
| ModalForm | Consistent modal layout |
| ConfirmDialog | Delete confirmations |
| RequestCard | Training request card UI |
| EmployeeSelectList | Checkbox list for requests |
| FiltersBar | Search + dropdown filters |

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
| 2 | Admin - Divisions Management | Next |
| 3 | Admin - Departments Management | Pending |
| 4 | Admin - Training Categories | Pending |
| 5 | Admin - Division Training Assignment | Pending |
| 6 | Admin - Employees Directory | Pending |
| 7 | Admin - Manager Assignment | Pending |
| 8 | Manager - Dashboard & Team View | Pending |
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

### Current Slice: 2 - Admin Divisions Management
- [ ] Add Division model to Prisma schema
- [ ] Create divisions CRUD endpoints
- [ ] Build admin layout with sidebar
- [ ] Build divisions page UI

---

## 9. Build Guidelines

- Build **incrementally from screenshots** — do not add features, UI elements, or functionality not shown in the reference screenshots unless strictly necessary for the feature to function.
- Each piece of working functionality gets its **own small commit** before moving to the next.
- Follow the **implementation slices** order; do not skip ahead.
- Reuse existing UI components (shadcn/ui) before creating new ones.
- All new pages must follow the **responsive requirements** in Section 5.

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

### Auth Requirements (apply to every new feature)

- **Route protection**: All `/admin/*`, `/manager/*`, `/clerk/*` routes are protected by Next.js middleware (`src/middleware.ts`). Unauthenticated users are redirected to `/login`. This is already in place — do not remove or bypass it.
- **Auth context**: Every page/component that needs the current user must use the `useAuth()` hook from `src/context/auth-context.tsx`. Do **not** call `api.auth.me()` directly in individual components.
- **Role-specific layouts**: Each role layout (`admin/layout.tsx`, `manager/layout.tsx`, `clerk/layout.tsx`) uses `useAuth()` to display the user's name and provide a logout button.
- **API protection**: Every backend endpoint must be guarded with `JwtAuthGuard` + `RolesGuard` and the appropriate `@Roles()` decorator.

---

## 10. Screenshot Reference Log

| Date | Feature | Screenshot |
|------|---------|------------|
| 2026-03-05 | Login Page | Screenshot 2026-03-05 130018.png |
| 2026-03-05 | Signup Page | Screenshot 2026-03-05 143539.png |
| 2026-03-07 | Admin Divisions Page | Screenshot 2026-03-07 101313.png |
| 2026-03-07 | Admin Add Division Modal | Screenshot 2026-03-07 101357.png |
| 2026-03-07 | Admin Add Department Modal | Screenshot 2026-03-07 101413.png |
