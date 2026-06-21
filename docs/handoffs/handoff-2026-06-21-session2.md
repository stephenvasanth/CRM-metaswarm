# Session Handoff — 2026-06-21 (Session 2)

## Objective

Build a web-based CRM from scratch on branch `feature/crm-initial-build`. The overall plan has 14 work units (WU-01 through WU-14). This session completed WU-10 (Deals Drag-and-Drop). The next session must implement the remaining WUs.

**Branch:** `feature/crm-initial-build`
**Repo root:** `C:\Users\stephen\OneDrive\AI_Upskilling\CRM-metaswarm`
**Plan file:** `.beads/plans/active-plan.md` (status: approved)

---

## Tech Stack

| Layer | Tech | Directory |
|---|---|---|
| Frontend | Angular 20 (standalone components, strict TS) | `crm-ui/` |
| Backend | Java 21 + Spring Boot 3.3.x | `crm-service/` |
| Database | PostgreSQL | V1 schema at `crm-service/src/main/resources/db/migration/V1__create_all_domain_tables.sql` |
| Cache | Redis (cache-first, TTL 24h, hard constraint) | configured in `crm-service/` |

**Java home:** `JAVA_HOME=C:\Users\stephen\OneDrive\jdk-21` — ALWAYS set before Maven. System java is Java 8.

---

## Critical Finding: Backend-Frontend Mismatch

**WU-06 (Contacts + Companies Backend) and WU-08 (Deals Backend) are CLOSED in beads but their Java code was NEVER COMMITTED.**

### What exists on disk (Java):
- `crm-service/src/main/java/com/crm/domain/auth/` — AuthController, AuthService, DTOs ✅
- `crm-service/src/main/java/com/crm/domain/user/` — User, UserRepository, UserService, UserController, DTOs ✅
- `crm-service/src/main/java/com/crm/domain/company/` — **empty directory** ❌
- `crm-service/src/main/java/com/crm/domain/contact/` — **empty directory** ❌
- `crm-service/src/main/java/com/crm/domain/tag/` — **empty directory** ❌
- No `domain/deal/` directory at all ❌

### What exists on disk (Frontend stubs — placeholder only):
- `crm-ui/src/app/features/activities/activities-feed/activities-feed.component.ts` — stub: `<p>Activities — coming in WU-08</p>`
- `crm-ui/src/app/features/tasks/tasks-list/tasks-list.component.ts` — stub: `<p>Tasks — coming in WU-09</p>`
- `crm-ui/src/app/features/admin/tags/tags.component.ts` — stub: `<p>Tags — coming in WU-10</p>`

### What is fully implemented (committed):
- WU-01: Infrastructure (docker-compose, Dockerfiles, nginx)
- WU-02: Spring Boot scaffold (security, JWT, Redis, global error handler, V1 schema migration)
- WU-03: Angular 20 app shell, routing, design tokens, shared components (toast, confirm dialog, auth guard, interceptors)
- WU-04: Backend auth (User entity, UserService, UserController, login endpoint)
- WU-05: Frontend auth (login page, auth service, admin users list, profile page)
- WU-07: Contacts frontend (contacts-list, contact-detail, contact-form, contact.service.ts, company.service.ts, tag-chip) — calls `/api/contacts` but backend doesn't exist yet
- WU-09: Deals frontend (deals-board, deal-card/column inline, deal-drawer, deal.service.ts) — calls `/api/deals` but backend doesn't exist yet
- WU-10: Deals drag-and-drop (CDK DragDropModule, optimistic UI, onDrop() handler, revert on error)

---

## What Must Be Done Next

### Phase A (PREREQUISITE — must be done first, sequential)

Implement the missing backend for WU-06 and WU-08. This is the foundation that WU-11/12/13 all depend on.

**Package:** `com.crm.domain.*`

**Files to create** (following the pattern in `com.crm.domain.user.*`):

#### Company domain (`com.crm.domain.company`)
- `Company.java` — entity: id (BIGSERIAL), name (VARCHAR 255), createdAt, updatedAt
- `CompanyRepository.java` — extends JpaRepository<Company, Long>
- `CompanyService.java` — `findAll()` with Redis cache (key `"companies:all"`, TTL 24h), invalidate on writes (none for companies since read-only)
- `CompanyController.java` — `GET /api/companies` only (no write endpoints per plan)
- `dto/CompanyDto.java` — id, name
- Tests: CompanyServiceTest, CompanyControllerTest (100% coverage)

#### Tag domain (`com.crm.domain.tag`)
- `Tag.java` — entity: id (BIGSERIAL), name (VARCHAR 100, unique), colour (VARCHAR 7, default '#6366F1'), createdAt
- `TagRepository.java`
- `TagService.java` — findAll() cached (key `"tags:all"`, TTL 24h), createTag() (ADMIN), deleteTag() (removes from contact_tags via native query, then deletes, invalidates cache)
- `TagController.java` — `GET /api/tags` (authenticated), `POST /api/tags` (ADMIN), `DELETE /api/tags/:id` (ADMIN)
- `dto/TagDto.java`, `dto/CreateTagRequest.java`
- Tests (100% coverage, cache-hit and cache-miss both tested)

#### Contact domain (`com.crm.domain.contact`)
- `Contact.java` — entity: id, firstName, lastName, email, phone, jobTitle, @ManyToOne Company, @ManyToOne User (owner), @ManyToMany Tag (join table contact_tags), createdAt, updatedAt
- `ContactRepository.java` — with `findBySearchTerm(String search, Pageable pageable)` using JPQL LIKE on name/email
- `ContactService.java` — cache-first reads (key `"contacts:page:{page}:{size}:{search}:{tagId}"`, TTL 24h), invalidate all `contacts:*` keys on write; hard delete cascades to activities (DB ON DELETE CASCADE), clears contact_id on tasks (set null)
- `ContactController.java` — CRUD at `/api/contacts`, search/pagination/tag filter
- `dto/ContactDto.java`, `dto/CreateContactRequest.java`, `dto/ContactSummaryDto.java`
- Tests (100% coverage, cache-hit and cache-miss both tested)

#### Deal domain (`com.crm.domain.deal`)
- `Deal.java` — entity: id, title, value (NUMERIC 15,2), stage (@Enumerated DealStage), expectedClose (LocalDate, column `expected_close`), @ManyToOne Contact, @ManyToOne User (owner), notes (TEXT), createdAt, updatedAt
- `DealStage.java` — enum: LEAD, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
- `DealRepository.java`
- `DealService.java` — cache-first reads (key `"deals:all"`, TTL 24h), `updateStage()`, `getStats()` (per-stage count+value), invalidate `deals:*` on writes
- `DealController.java` — CRUD at `/api/deals`, `PATCH /api/deals/:id/stage`, `GET /api/deals/stats`
- `dto/DealDto.java`, `dto/CreateDealRequest.java`, `dto/UpdateDealRequest.java`, `dto/StageUpdateRequest.java`, `dto/DealStatsDto.java`
- Tests (100% coverage, all 6 stages, cache-hit and cache-miss)

**Important patterns to follow (from `UserService.java`):**
- Constructor injection (not @Autowired)
- `@Transactional` on service class, `@Transactional(readOnly = true)` on read methods
- `@PreAuthorize("hasRole('ADMIN')")` on admin-only controller methods
- Redis cache: `redisTemplate.opsForValue().get(key)` → if null, fetch from DB, `redisTemplate.opsForValue().set(key, value, 24, TimeUnit.HOURS)` → return. On writes: `redisTemplate.delete(key)` or `redisTemplate.keys("contacts:*").forEach(redisTemplate::delete)`.
- `ResourceNotFoundException` for 404s (already exists at `com.crm.exception.ResourceNotFoundException`)
- DTOs use static factory `from(entity)` methods (see `UserDto.java`)

**Coverage gate (BLOCKING):** `set JAVA_HOME=C:\Users\stephen\OneDrive\jdk-21 && cd crm-service && mvn test jacoco:report` — must reach 100% lines/branches/functions/statements per `.coverage-thresholds.json`.

---

### Phase B (after Phase A is committed — can be done in parallel)

With the backend foundation in place, implement WU-11, WU-12, WU-13 as three parallel worktree agents.

**Beads IDs:** WU-11 = `CRM-metaswarm-9qb`, WU-12 = `CRM-metaswarm-5tn`, WU-13 = `CRM-metaswarm-ivf`

#### WU-11: Activities Full Stack (`CRM-metaswarm-9qb`)

**Backend files to create** (`com.crm.domain.activity`):
- `Activity.java` — entity: id, type (ActivityType enum), subject (VARCHAR 255), notes (TEXT), occurredAt (Instant, column `occurred_at`), @ManyToOne Contact, @ManyToOne Deal, @ManyToOne User (author), createdAt
- `ActivityType.java` — enum: CALL, EMAIL, MEETING, NOTE
- `ActivityRepository.java` — queries: findByContactId, findByDealId, findAll paginated, filter by type/contactId/date range
- `ActivityService.java` — cache-first reads (`"activities:page:*"`, TTL 24h), invalidate on POST/DELETE
- `ActivityController.java`:
  - `POST /api/activities` — creates activity (author = current user from JWT)
  - `GET /api/activities` — paginated global feed, filter by `?type=`, `?contactId=`, `?from=&to=`
  - `DELETE /api/activities/:id` — no edit endpoint (ACT-04 deferred)
  - `GET /api/contacts/:id/activities` — activities for contact
  - `GET /api/deals/:id/activities` — activities for deal
- Tests (100% coverage)

**Frontend files to replace** (currently stubs):
- `crm-ui/src/app/features/activities/activities-feed/activities-feed.component.ts` — replace stub with: type filter tabs (CALL/EMAIL/MEETING/NOTE/All), contact filter dropdown, date range inputs, paginated scrollable list of activity-cards
- **New:** `crm-ui/src/app/features/activities/log-activity-drawer/log-activity-drawer.component.ts` — 400px right-slide drawer: type selector tabs, subject field, notes textarea, contact link (searchable select), deal link (optional select), date/time picker; typed FormGroup; calls POST /api/activities
- **New:** `crm-ui/src/app/features/activities/activity-card/activity-card.component.ts` — displays: type icon (colour-coded), subject, notes snippet, contact/deal link, date; delete button with confirm dialog calling DELETE /api/activities/:id
- **New:** `crm-ui/src/app/core/services/activity.service.ts` — typed HttpClient calls to all activity endpoints
- **New:** spec files for all above (100% coverage)
- **Modify:** `crm-ui/src/app/features/contacts/contact-detail/contact-detail.component.ts` — wire up the activity tab (right panel) to call GET /api/contacts/:id/activities and render activity-card list
- **Modify:** `crm-ui/src/app/features/deals/deal-drawer/deal-drawer.component.ts` — wire up Activity Feed tab to call GET /api/deals/:id/activities

**Activity type colours (via CSS vars):**
- CALL: `#3B82F6` (blue)
- EMAIL: `#8B5CF6` (purple)
- MEETING: `#10B981` (green)
- NOTE: `#94A3B8` (grey)

**DoD:**
- [ ] POST/GET/DELETE /api/activities endpoints working and cached
- [ ] GET /api/contacts/:id/activities and GET /api/deals/:id/activities working
- [ ] Activities feed page: type filter, contact filter, date range, paginated list
- [ ] Log Activity drawer: all fields, typed FormGroup, calls POST
- [ ] Activity type colour coding via CSS tokens
- [ ] Activity feed visible on contact-detail right panel and deal-drawer activity tab
- [ ] 100% test coverage (backend + frontend)

---

#### WU-12: Tasks Full Stack (`CRM-metaswarm-5tn`)

**Backend files to create** (`com.crm.domain.task`):
- `Task.java` — entity: id, title (VARCHAR 255), description (TEXT), dueDate (LocalDate, column `due_date`), completed (boolean, default false), @ManyToOne User (assignee), @ManyToOne Contact, @ManyToOne Deal, createdAt, updatedAt
- `TaskRepository.java` — queries: findByAssigneeId, findByContactId, findByDealId, filter by completed/dueDate
- `TaskService.java` — cache-first reads (`"tasks:*"`, TTL 24h), complete toggle, filters: overdue (due_date < today AND completed=false), today (due_date = today), upcoming (due_date > today AND completed=false)
- `TaskController.java`:
  - `GET /api/tasks` — filter by `?assigneeId=`, `?status=completed|open`, `?due=overdue|today|upcoming`
  - `POST /api/tasks` — creates task
  - `PUT /api/tasks/:id` — updates task
  - `DELETE /api/tasks/:id` — deletes task
  - `PATCH /api/tasks/:id/complete` — toggles completion
- Tests (100% coverage)

**Frontend files to replace** (currently stub):
- `crm-ui/src/app/features/tasks/tasks-list/tasks-list.component.ts` — replace stub with: filter tabs (All / My Tasks / Overdue / Due Today / Upcoming / Completed), task rows with checkbox toggle (optimistic — reverts on error with toast), overdue rows highlighted red, due-today rows orange, completed rows strikethrough+muted
- **New:** `crm-ui/src/app/features/tasks/task-drawer/task-drawer.component.ts` — 400px right-slide drawer: title* (required), description, due date picker, assignee select (users), contact link (optional searchable select), deal link (optional searchable select); typed FormGroup; delete button triggers confirm dialog before DELETE /api/tasks/:id
- **New:** `crm-ui/src/app/core/services/task.service.ts` — typed HttpClient calls to all task endpoints
- **New:** spec files for all above (100% coverage)
- **Modify:** `crm-ui/src/app/features/contacts/contact-detail/contact-detail.component.ts` — wire up the tasks tab (right panel) to call GET /api/tasks?contactId=:id

**Optimistic toggle:**
```typescript
// In TasksListComponent.onToggle(task: Task):
task.completed = !task.completed;  // optimistic
this.taskService.toggleComplete(task.id).subscribe({
  next: updated => task.completed = updated.completed,
  error: () => { task.completed = !task.completed; this.toastService.add('Failed to update task', 'error'); }
});
```

**DoD:**
- [ ] GET/POST/PUT/DELETE/PATCH /api/tasks endpoints working and cached
- [ ] Filter tabs (All/My Tasks/Overdue/Due Today/Upcoming/Completed) each call correct filter params
- [ ] Optimistic toggle with revert-on-error
- [ ] Visual states: overdue=red, today=orange, completed=strikethrough+muted
- [ ] Task drawer with typed FormGroup, confirm dialog on delete
- [ ] Tasks visible on contact-detail right panel
- [ ] 100% test coverage

---

#### WU-13: Tags Admin Full Stack (`CRM-metaswarm-ivf`)

**Backend note:** Tag entity, TagRepository, TagService, TagController were planned as part of Phase A above (they were in WU-06 scope). By the time WU-13 runs, these should already exist. WU-13's backend work is therefore just verifying they exist and adding any missing admin-specific endpoints if needed.

**Frontend files to replace** (currently stub):
- `crm-ui/src/app/features/admin/tags/tags.component.ts` — replace stub with: list of tags showing colour swatch + name + contact count + delete button; inline "New Tag" form with name input + colour picker (`<input type="color">`); delete triggers confirm dialog before DELETE /api/tags/:id; `@adminGuard` protected (already wired in routes)
- **New:** spec file for tags.component (100% coverage)
- **Verify:** `crm-ui/src/app/shared/components/tag-chip/tag-chip.component.ts` already exists (from WU-07) — just verify it accepts `{ name: string, colour: string }` input and renders correctly

**DoD:**
- [ ] GET /api/tags (authenticated), POST /api/tags (ADMIN), DELETE /api/tags/:id (ADMIN) all working
- [ ] USER role gets 403 on POST/DELETE
- [ ] Tags admin page: colour swatch + name + contact count + delete with confirm
- [ ] New tag inline form with colour picker
- [ ] Tag chips render correctly on contacts (already done in WU-07's tag-chip component)
- [ ] 100% test coverage

---

### Phase C (after WU-11/12/13 — final WU)

#### WU-14: Dashboard Full Stack (`CRM-metaswarm-w94`)
Backend: `DashboardController`, `DashboardService` (cached TTL **5 min** — shorter than domain TTL), `DashboardStatsDto`
- `GET /api/dashboard` returns: open deal count, pipeline value, tasks due today (current user), new contacts last 7 days, deals by stage (count+value), recent 10 activities, current user's 5 upcoming tasks

Frontend: `dashboard.component.ts` (replace existing stub), `metric-card`, `pipeline-chart`, `dashboard.service.ts`
- 4-column metric grid, pipeline bar chart by stage, My Tasks widget (5 tasks), Recent Activity feed (10 items)
- Default route `/` renders dashboard

Dependencies: WU-11, WU-12, WU-13 must all be complete.

---

## Routing & Sidebar (already wired — do NOT modify)

`crm-ui/src/app/app.routes.ts` already has routes for `/activities`, `/tasks`, `/admin/tags`, `/dashboard` — all lazy-loaded. Do not add duplicate routes.

`crm-ui/src/app/layout/sidebar/sidebar.component.ts` already has nav items for Activities (&#128337;), Tasks (&#9989;), and admin Tags (&#127991;). Do not modify sidebar.

---

## Key Architecture Rules

### Redis Cache-First (MANDATORY — NFR-P03)
Every backend read must:
1. Check Redis: `Object cached = redisTemplate.opsForValue().get(key);`
2. If hit: return cached value
3. If miss: fetch from PostgreSQL, `redisTemplate.opsForValue().set(key, value, 24, TimeUnit.HOURS)`, return
4. On any write (POST/PUT/DELETE/PATCH): `redisTemplate.delete(key)` or wildcard `redisTemplate.keys("prefix:*").forEach(redisTemplate::delete)`

Dashboard uses TTL 5 min (not 24h).

Both cache-hit and cache-miss paths MUST be tested (this is a coverage gate requirement).

### Backend Patterns (`com.crm.domain.user.*` is the reference)
- Entity: plain getters/setters, `@PrePersist`/`@PreUpdate` for timestamps
- Service: constructor injection, `@Transactional`, `@Transactional(readOnly = true)` on reads, `ResourceNotFoundException` for 404s
- Controller: `@RestController`, `@RequestMapping("/api/...")`, `@Valid` on request bodies, `@AuthenticationPrincipal UserDetails` for current user, `@PreAuthorize("hasRole('ADMIN')")` for admin endpoints
- DTO: static `from(Entity)` factory method

### Frontend Patterns
- All components: `standalone: true`, no NgModules
- Forms: typed `FormGroup<T>` — never untyped `FormGroup`
- HTTP: `inject(HttpClient)`, typed responses
- All styles: CSS custom properties from `styles.css` — never hardcoded hex colours or px values
- Drawers: 400px right-slide, used for log-activity, task create/edit, tag creation
- Destructive actions: always confirm dialog before DELETE call
- Errors: `toastService.add('message', 'error')` (4s auto-dismiss, top-right)

### Coverage Gate (BLOCKING)
Backend: `set JAVA_HOME=C:\Users\stephen\OneDrive\jdk-21 && cd crm-service && mvn test jacoco:report`
Frontend: `cd crm-ui && npm run test:coverage -- --watch=false`
Both must hit 100% lines/branches/functions/statements per `.coverage-thresholds.json`.

---

## Working Directory Layout

```
CRM-metaswarm/
├── crm-service/              ← Java Spring Boot backend
│   ├── src/main/java/com/crm/
│   │   ├── config/           ← RedisConfig, CorsConfig, SecurityConfig
│   │   ├── domain/
│   │   │   ├── auth/         ← AuthController, AuthService ✅
│   │   │   ├── user/         ← User entity, UserService, UserController ✅
│   │   │   ├── company/      ← EMPTY — needs Phase A implementation
│   │   │   ├── contact/      ← EMPTY — needs Phase A implementation
│   │   │   ├── tag/          ← EMPTY — needs Phase A implementation
│   │   │   └── deal/         ← MISSING — needs Phase A implementation
│   │   ├── exception/        ← GlobalExceptionHandler, ResourceNotFoundException ✅
│   │   └── security/         ← JwtTokenProvider, JwtAuthenticationFilter ✅
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/
│           ├── V1__create_all_domain_tables.sql  ← ALL tables already defined
│           └── V2__seed_admin_user.sql
│
└── crm-ui/                   ← Angular 20 frontend
    └── src/app/
        ├── app.routes.ts     ← ALL routes already wired ✅
        ├── core/
        │   ├── guards/       ← authGuard, adminGuard ✅
        │   ├── interceptors/ ← auth.interceptor, error.interceptor ✅
        │   └── services/
        │       ├── auth.service.ts, toast.service.ts ✅
        │       ├── contact.service.ts, company.service.ts ✅
        │       ├── deal.service.ts ✅
        │       └── (activity.service.ts, task.service.ts — TO CREATE)
        ├── features/
        │   ├── contacts/     ← FULLY IMPLEMENTED (list, detail, form) ✅
        │   ├── deals/        ← FULLY IMPLEMENTED (board, drawer, DnD) ✅
        │   ├── activities/   ← STUB ONLY — replace in WU-11
        │   ├── tasks/        ← STUB ONLY — replace in WU-12
        │   ├── admin/
        │   │   ├── users/    ← IMPLEMENTED ✅
        │   │   └── tags/     ← STUB ONLY — replace in WU-13
        │   └── dashboard/    ← STUB — replace in WU-14
        ├── layout/
        │   ├── sidebar/      ← FULLY IMPLEMENTED (nav items wired) ✅
        │   └── app-shell/    ← FULLY IMPLEMENTED ✅
        └── shared/components/
            ├── toast/, confirm-dialog/, skeleton/, avatar/, button/ ✅
            └── tag-chip/ ✅
```

---

## Beads Workflow

```bash
bd ready                          # see what's ready
bd update <id> --claim            # claim before starting
bd close <id> --reason "..."     # close when done
```

**Open issues:**
- `CRM-metaswarm-9qb` — WU-11: Activities Full Stack
- `CRM-metaswarm-5tn` — WU-12: Tasks Full Stack
- `CRM-metaswarm-ivf` — WU-13: Tags Admin Full Stack
- `CRM-metaswarm-w94` — WU-14: Dashboard Full Stack

**Session close protocol (MANDATORY):**
```bash
git add <files>
git commit -m "..."
git push
```

---

## Execution Method Agreed

User chose **Metaswarm orchestrated execution** (4-phase loop: IMPLEMENT → VALIDATE → ADVERSARIAL REVIEW → COMMIT) for all remaining WUs.

---

## Immediate Next Action

1. Implement **Phase A** (backend foundation) first — single sequential agent creates Contact, Company, Tag, Deal entities + repos + services + controllers in the 4 empty backend domain directories. Maven tests must pass at 100% coverage before committing.
2. After Phase A is committed, spawn WU-11/12/13 in **parallel worktrees** using `isolation: "worktree"` on the Agent tool.
3. Then WU-14 (Dashboard) after all three complete.
