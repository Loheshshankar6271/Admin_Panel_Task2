# System Masters — Master Data Management (Extension)

Module Owner: **System Masters**
Added on top of the existing admin dashboard. **No existing code, env files, backend, or database were replaced** — this is purely additive, using the same Express/PostgreSQL backend and the same database as the rest of the app.

## What was added

**Features:** Relationship Master · Medical Conditions Master · Specialties Master · Notification Categories Master · Status Master
**Screens (each master):** List · Add · Edit · Delete · Search · Pagination

### New database tables (additive migration)
`backend/migrations/002_system_masters.sql` — run this once against the **same** database used by the app (same `DATABASE_URL` / `DB_*` env vars, nothing in `.env` needs to change):

```bash
psql -d admin_dashboard -f backend/migrations/002_system_masters.sql
# or, if using a single connection string:
psql "$DATABASE_URL" -f backend/migrations/002_system_masters.sql
```

It only does `CREATE TABLE IF NOT EXISTS` / `INSERT ... ON CONFLICT DO NOTHING`, so it's safe to re-run and never touches the existing `orders`/`users` tables or `schema.sql`.

Tables created (all share the same shape: `id, name, code, description, is_active, sort_order, created_at, updated_at`):

| Table | Master |
|---|---|
| `healthcare_relationships` | Relationship Master |
| `healthcare_medical_conditions` | Medical Conditions Master |
| `healthcare_specialties` | Specialties Master |
| `master_notification_categories` | Notification Categories Master |
| `master_statuses` | Status Master |

Each table is seeded with sensible demo data so the screens aren't empty on first load.

### New backend code (no existing routes touched)
- `backend/src/utils/masterRouterFactory.js` — one reusable CRUD router (list/search/paginate, get, create, update, delete) shared by all 5 masters, since they're structurally identical. Avoids hand-writing 5 near-duplicate route files.
- `backend/src/routes/masters.js` — mounts the 5 masters under `/api/masters/*`.
- `backend/src/index.js` — **2 lines added** to register the new route (no existing line changed).

API endpoints (all require a valid JWT, same `auth.js` middleware as the rest of the app):

```
GET    /api/masters/relationships
GET    /api/masters/medical-conditions
GET    /api/masters/specialties
GET    /api/masters/notification-categories
GET    /api/masters/statuses
        ?search=&is_active=true|false&page=&limit=&sort=name|code|sort_order|created_at&order=ASC|DESC

GET    /api/masters/<resource>/:id
POST   /api/masters/<resource>          (manager, super_admin)
PUT    /api/masters/<resource>/:id      (manager, super_admin)
DELETE /api/masters/<resource>/:id      (super_admin only)
```

### New frontend code
- `frontend/src/pages/masters/MasterDataPage.jsx` — one generic, reusable List/Add/Edit/Delete/Search/Pagination screen.
- `frontend/src/pages/masters/{Relationships,MedicalConditions,Specialties,NotificationCategories,Statuses}Page.jsx` — thin pages that just configure the generic component (icon, title, API path).
- `frontend/src/App.jsx` — 5 routes added under `/masters/...`.
- `frontend/src/components/layout/Sidebar.jsx` — new "Master Data" nav section added (existing "Navigation" section untouched).
- `frontend/src/components/layout/Layout.jsx` — topbar titles added for the 5 new routes.

---

## Task 2 Extension — Public API + expanded masters

Purely additive on top of Parts 1–2 above (in fact this project started fresh from the original v8 zip, so "Part 2" from an earlier session doesn't apply here — everything below is what's actually in this zip). No existing table, route, page, or CRUD operation was removed. Verified end-to-end against a real Postgres instance: all migrations run cleanly, the server boots with zero route conflicts, every public endpoint returns exactly the fields specified below, every existing `/api/masters/*` admin endpoint still works, and the frontend still builds unmodified.

### New database objects (`backend/migrations/003_task2_extension.sql`)

```bash
psql -d admin_dashboard -f backend/migrations/002_system_masters.sql   # if not already run
psql -d admin_dashboard -f backend/migrations/003_task2_extension.sql
```

| Table | Notes |
|---|---|
| `medical_record_categories` | id, name, code, description, is_active, sort_order, created_at, updated_at |
| `medical_record_sub_categories` | + `category_id` FK, unique per category |
| `medical_record_types` | + `category_id` FK, `sub_category_id` FK (nullable), `unit` |
| `medical_record_tags` | id, name, code, description, is_active, sort_order, created_at, updated_at |
| `user_roles` | + `type` ('system' \| 'custom') — reference list only, does **not** touch `users.role` or `auth.js` |
| `healthcare_specialties` | **altered** (additive `ADD COLUMN IF NOT EXISTS`) — adds `image_url`, `image_storage_path`, `image_storage_bucket`, `image_file_name`, `image_file_size`, `image_mime_type`, all nullable |

### New Public API (unauthenticated, read-only) — `backend/src/routes/publicApi.js`

Mounted directly at `/api` (not `/api/masters`), registered in `index.js` alongside — not instead of — the existing `/api/masters` mount. Field names/shapes match the Task 2 Extension email exactly, including aliases (`condition_name`, `tag_name`, camelCase `createdAt`/`updatedAt` on user-roles) and nested objects:

```
GET /api/relationships[/:id]
GET /api/medical-conditions[/:id]
GET /api/medical-record-categories[/:id]                       -> nested subCategories[], each with nested types[]
GET /api/medical-record-categories/sub-categories[/:id]        -> nested category{}
GET /api/medical-record-categories/types[/:id]                 -> nested category{}, subCategory{} (nullable)
GET /api/medical-record-tags[/:id]
GET /api/specialties[/:id]
GET /api/user-roles[/:id]
```
List endpoints return a bare JSON array; detail endpoints return a bare JSON object (404 `{ error }` if not found). No auth, no pagination — matches the "public" framing in the spec.

### Expanded Admin CRUD (authenticated, `/api/masters/*`) — unchanged permission model (GET: any logged-in user · POST/PUT: manager/super_admin · DELETE: super_admin)

- `medical-record-categories` (+ nested `/sub-categories`, `/types`) — new files `routes/medicalRecordCategoriesAdmin.js`, `routes/medicalRecordTypesAdmin.js`, `utils/linkedMasterRouterFactory.js`
- `medical-record-tags` — reuses the existing `masterRouterFactory.js` as-is
- `user-roles` — new file `routes/userRolesAdmin.js` (bespoke, for the `type` field)
- `specialties` — **swapped** from the generic factory to a new bespoke router (`routes/specialtiesAdmin.js`) that adds the `image_*` fields while preserving every original field, filter, and permission exactly as before

### Files touched (append-only edits)
- `backend/src/index.js` — 2 lines added (require + mount `publicApiRoutes` at `/api`)
- `backend/src/routes/masters.js` — specialty mount swapped to the extended router; 3 new mounts added for medical-record-categories/tags/user-roles
- `frontend/src/context/AuthContext.jsx` — 3 new permissions added (`view_masters`, `manage_masters`, `delete_masters`); existing permissions for super_admin/manager/staff are unchanged, only extended.

### Permissions
- **Staff:** no access (not shown in sidebar).
- **Manager:** view, add, edit. Cannot delete.
- **Super Admin:** full access, including delete.

This was verified end-to-end (login → list → search → paginate → create → duplicate-name rejection → edit → toggle active/inactive → role-restricted delete) against a local PostgreSQL instance before packaging.

## How to deploy
1. Unzip and replace your project folder (or just copy in the new/changed files listed above).
2. Run the migration SQL once against your existing database.
3. `npm install` in `backend/` and `frontend/` as usual (no new dependencies were added — only existing ones like `express`, `pg`, `react`, `lucide-react`, `react-hot-toast` are used).
4. Start the app as you normally do. Nothing in `.env` / `.env.example` needs to change.
