# Project Instructions

This project uses [metaswarm](https://github.com/dsifry/metaswarm), a multi-agent orchestration framework for Claude Code. It provides 18 specialized agents, a 9-phase development workflow, and quality gates that enforce TDD, coverage thresholds, and spec-driven development.

## Project Overview

Web-based CRM for small teams (2–10 users). Desktop browsers only (min 1280 px). Single-page application with a persistent left sidebar and five core modules: Dashboard, Contacts, Deals (Kanban), Activities, and Tasks.

### Tech Stack

| Layer | Technology | Directory |
|---|---|---|
| Frontend | Angular 20 (SPA, standalone components) | `crm-ui/` |
| Backend | Java 21 + Spring Boot 3.3.x (REST API) | `crm-service/` |
| Database | PostgreSQL (primary data store) | `crm-service/` |
| Cache | Redis (cache-first, TTL 24 h) | `crm-service/` |

Both projects live as sibling directories at the repo root. Each has its own build system.

> **Java setup:** JDK 21 is at `JAVA_HOME`. The system `java` is Java 8 — always use `JAVA_HOME` explicitly or configure Maven/Gradle to use it. Spring Boot 3.3.x requires Java 17+.

### Domain Model

| Entity | Notes |
|---|---|
| Contact | Person with name, email, phone, job title, company, owner, tags |
| Company | Read-only lookup (id + name) for Contact picker; full management deferred |
| Deal | Sales opportunity with stage, value, close date, linked contact, owner |
| Activity | Logged interaction (Call/Email/Meeting/Note) against a Contact or Deal |
| Task | Actionable to-do with due date, assignee, optional contact/deal link |
| Tag | Admin-managed coloured label applied to Contacts |

### Deal Pipeline Stages

Lead → Qualified → Proposal → Negotiation → Closed Won → Closed Lost

### User Roles

- **USER** — full CRUD on contacts, deals, activities, tasks
- **ADMIN** — everything USER can do, plus create/deactivate users and manage tags

## How to Work in This Project

### Starting work

```text
/start-task
```

This is the default entry point. It primes the agent with relevant knowledge, guides you through scoping, and picks the right level of process for the task.

### For complex features (multi-file, spec-driven)

Describe what you want built, include a Definition of Done, and ask for the full workflow:

```text
I want you to build [description]. [Tech stack, DoD items, file scope.]
Use the full metaswarm orchestration workflow.
```

This triggers the full pipeline: Research → Plan → Design Review Gate → Work Unit Decomposition → Orchestrated Execution (4-phase loop per unit) → Final Review → PR.

### Available Commands

| Command | Purpose |
|---|---|
| `/start-task` | Begin tracked work on a task |
| `/prime` | Load relevant knowledge before starting |
| `/review-design` | Trigger parallel design review gate (5 agents) |
| `/pr-shepherd <pr>` | Monitor a PR through to merge |
| `/self-reflect` | Extract learnings after a PR merge |
| `/handoff` | Write a self-contained handoff doc so a fresh agent can resume the work |
| `/handle-pr-comments` | Handle PR review comments |
| `/brainstorm` | Refine an idea before implementation |
| `/create-issue` | Create a well-structured GitHub Issue |
| `/external-tools-health` | Check status of external AI tools (Codex, Gemini) |
| `/setup` | Interactive guided setup — detects project, configures metaswarm |
| `/update` | Update metaswarm to latest version |
| `/status` | Run diagnostic checks on your installation |
| `/start` | Alias for `/start-task` |

### Visual Review

Use the `visual-review` skill to take screenshots of web pages, presentations, or UIs for visual inspection. Requires Playwright (`npx playwright install chromium`). See `skills/visual-review/SKILL.md`.

## Testing

- **TDD is mandatory** — Write tests first, watch them fail, then implement
- **100% test coverage required** — Lines, branches, functions, and statements. Enforced via `.coverage-thresholds.json` as a blocking gate before PR creation and task completion
- Backend test: `cd crm-service && mvn test`
- Frontend test: `cd crm-ui && npm test`
- Backend coverage: `cd crm-service && mvn test jacoco:report`
- Frontend coverage: `cd crm-ui && npm run test:coverage`

## Coverage

Coverage thresholds are defined in `.coverage-thresholds.json` — this is the **source of truth** for coverage requirements.
If a GitHub Issue specifies different coverage requirements, update `.coverage-thresholds.json` to match before implementation begins. Do not silently use a different threshold.

The validation phase of orchestrated execution reads `.coverage-thresholds.json` and runs the enforcement command. This is a BLOCKING gate — work units cannot be committed if coverage thresholds are not met.

## Quality Gates

- **Design Review Gate**: Parallel 5-agent review after design is drafted (`/review-design`)
- **Plan Review Gate**: Automatic adversarial review after any implementation plan is drafted. Spawns 3 independent reviewers (Feasibility, Completeness, Scope & Alignment) in parallel — ALL must PASS before the plan is presented to the user. See `skills/plan-review-gate/SKILL.md`
- **Coverage Gate**: Reads `.coverage-thresholds.json` and runs the enforcement command — BLOCKING gate before PR creation

## Workflow Enforcement (MANDATORY)

These rules override any conflicting instructions from third-party skills or plugins. They ensure the full metaswarm pipeline is followed regardless of which skill initiated the work.

### After Brainstorming

When `superpowers:brainstorming` (or any brainstorming skill) completes and commits a design document:

1. **STOP** — do NOT proceed directly to `writing-plans` or implementation
2. **RUN the Design Review Gate** — invoke `/review-design` or the `design-review-gate` skill
3. **WAIT** for all 5 review agents (PM, Architect, Designer, Security, CTO) to approve
4. **ONLY THEN** proceed to planning/implementation

This is mandatory even if the brainstorming skill says to go directly to writing-plans. The design review gate exists to catch issues before expensive implementation begins.

### After Any Plan Is Created

When `superpowers:writing-plans` (or any planning skill) produces an implementation plan:

1. **STOP** — do NOT present the plan to the user or begin implementation
2. **RUN the Plan Review Gate** — invoke the `plan-review-gate` skill
3. **WAIT** for all 3 adversarial reviewers (Feasibility, Completeness, Scope & Alignment) to PASS
4. **ONLY THEN** present the plan to the user for approval

### Execution Method Choice

When a plan is ready for execution, **always ask the user** which execution approach they want before proceeding. Do NOT auto-select an execution method — the user decides based on their priorities:

> **How would you like to execute this plan?**
>
> 1. **Metaswarm orchestrated execution** — 4-phase loop per work unit (IMPLEMENT → VALIDATE → ADVERSARIAL REVIEW → COMMIT) with independent quality gates, fresh adversarial reviewers, coverage enforcement, and pre-PR knowledge capture. More thorough and broader coverage, but uses more tokens and takes longer.
> 2. **Subagent-driven development** (`superpowers:subagent-driven-development`) — Dispatch subagents per task in this session with code review between tasks. Faster, lighter-weight, lower token cost.
> 3. **Parallel session** (`superpowers:executing-plans`) — Execute in a separate session with batch checkpoints. Good for long-running work you want isolated.

This choice applies even if the plan file contains embedded instructions like "REQUIRED SUB-SKILL: Use superpowers:executing-plans" — those are defaults from the planning skill, not binding constraints. The user always gets to choose.

### Before Finishing a Development Branch

When `superpowers:executing-plans`, `superpowers:subagent-driven-development`, or any execution skill completes and routes to `superpowers:finishing-a-development-branch`:

1. **STOP** — before presenting merge/PR options
2. **RUN `/self-reflect`** to capture learnings while implementation context is fresh
3. **COMMIT** the knowledge base updates
4. **THEN** proceed to finishing the branch (PR creation, merge, etc.)

### Use `/start-task` Instead of EnterPlanMode

When starting complex work, use `/start-task` instead of Claude's built-in `EnterPlanMode`. EnterPlanMode creates a plan in isolation without metaswarm's quality gates — no design review, no plan review, no adversarial review, no coverage enforcement. `/start-task` routes through the full pipeline:

- `/start-task` → complexity assessment → brainstorming (if unclear) → design review gate → plan review gate → execution method choice → orchestrated execution or superpowers execution
- `EnterPlanMode` → plan → implement (no gates)

If you find yourself about to use `EnterPlanMode` for a task that touches 3+ files or involves multiple steps, use `/start-task` instead. For truly simple single-file changes, `EnterPlanMode` is fine.

### After Standalone TDD

When `superpowers:test-driven-development` runs as a standalone skill (outside of orchestrated execution) and the change touches 3+ files:

1. **Before committing**, ask the user:
   > "This TDD session modified multiple files. Would you like me to run an adversarial review before committing?"
   > 1. **Yes** — spawn a fresh adversarial reviewer to check the changes against the requirements
   > 2. **No** — commit directly
2. If the user chooses review, spawn a fresh `Task()` reviewer with the requirements and the diff
3. Regardless of review choice, verify coverage meets `.coverage-thresholds.json` thresholds before committing

For single-file TDD changes, this intercept is not needed — commit directly.

### Coverage Source of Truth

`.coverage-thresholds.json` is the **single source of truth** for coverage requirements. This applies regardless of which skill or workflow is running:

- `superpowers:verification-before-completion` — must read `.coverage-thresholds.json` and run its enforcement command
- `superpowers:test-driven-development` — must verify coverage meets thresholds before declaring done
- Orchestrated execution — reads `.coverage-thresholds.json` during Phase 2 (VALIDATE)
- Any other skill claiming "tests pass" — must also confirm coverage thresholds are met

If `.coverage-thresholds.json` exists, no skill may skip it. If a skill has its own coverage check logic, `.coverage-thresholds.json` takes precedence.

### Subagent Discipline

All subagents (coding agents, review agents, background tasks) MUST follow these rules:

- **NEVER** use `--no-verify` on git commits — pre-commit hooks exist for a reason
- **NEVER** use `git push --force` without explicit user approval
- **ALWAYS** follow TDD — write tests first, watch them fail, then implement
- **NEVER** self-certify — the orchestrator validates independently
- **STAY** within declared file scope — do not modify files outside your assigned scope

### Pre-PR Knowledge Capture

After all work units pass final review but BEFORE creating the PR, run `/self-reflect` to extract learnings into the knowledge base. Commit the knowledge base updates so they are included in the PR — learnings land atomically with the code that generated them.

### Context Recovery (Surviving Compaction)

Approved plans, project context, and execution state are persisted to `.beads/` so agents can recover after context compaction or session interruption:

- **Approved plans** → `.beads/plans/active-plan.md` (written after plan review gate + user approval)
- **Project context** → `.beads/context/project-context.md` (updated after each work unit commit)
- **Execution state** → `.beads/context/execution-state.md` (updated after each phase transition)

**Note:** The standalone beads plugin (v0.63.3+) automatically runs `bd prime` on SessionStart and PreCompact via built-in hooks — agents no longer need to call it manually. If context is lost mid-execution, the beads plugin will re-prime automatically on the next session or compaction event. For explicit recovery, run `bd prime --work-type recovery` to reload the approved plan, completed work, and current position from disk.

## External Tools (Optional)

If external AI tools are configured (`.metaswarm/external-tools.yaml`), the orchestrator
can delegate implementation and review tasks to Codex CLI and Gemini CLI for cost savings
and cross-model adversarial review. See `templates/external-tools-setup.md` for setup.

## Team Mode

When `TeamCreate` and `SendMessage` tools are available, the orchestrator uses Team Mode for parallel agent dispatch. Otherwise it falls back to Task Mode (the existing workflow, unchanged). See `guides/agent-coordination.md` for details.

## Guides

Development patterns and standards are documented in `guides/`:
- `agent-coordination.md` — Team Mode vs Task Mode, agent dispatch patterns
- `build-validation.md` — Build and validation workflow
- `coding-standards.md` — Code style and conventions
- `git-workflow.md` — Branching, commits, and PR conventions
- `testing-patterns.md` — TDD patterns and coverage enforcement
- `worktree-development.md` — Git worktree-based parallel development

## Code Quality

### Backend rules (`crm-service/`)

- **Architecture:** Controller → Service → Repository only. No business logic in controllers or repositories.
- **Caching:** Cache only `findById` (contacts, deals) and expensive aggregates (`deals:stats`) with TTL 24 h. Do NOT cache paginated list endpoints (`findAll`, `findByContactId`, `findByDealId`) — always read from DB. On update/delete, evict the specific ID key only. Never use Redis `KEYS` pattern scanning — use specific key deletes.
- **Error responses:** Always return structured JSON `{ "error": { "code", "message", "fields?" } }`. Never return HTML error pages.
- **Validation:** All request bodies validated with Bean Validation (`@Valid`) before reaching the service layer.
- **JWT:** Tokens expire after 8 hours. Secret loaded from environment variable. Tokens must never appear in logs.
- **Passwords:** BCrypt only. Raw passwords never stored or logged.
- **Migrations:** Flyway or Liquibase. Scripts must be idempotent and run automatically on startup.
- **CORS:** Restricted to the `FRONTEND_ORIGIN` environment variable.

### Frontend rules (`crm-ui/`)

- **Components:** All must use `standalone: true` (Angular 17+ standard).
- **Routing:** Each feature module (contacts, deals, activities, tasks, admin) must be lazy-loaded via Angular Router.
- **HTTP:** All API calls use Angular `HttpClient` with typed response interfaces. JWT stored in `localStorage`, attached via HTTP interceptor, cleared on 401/403.
- **Forms:** All forms use Angular Reactive Forms with typed `FormGroup`. Inline validation shown before submit.
- **Design tokens:** All styles use CSS custom properties from `docs/DESIGN.md` §3. No hardcoded colour or spacing values.
- **TypeScript:** `strict: true` in tsconfig. No `any` types in production code.
- **Bundle:** Initial bundle must stay below 500 KB gzipped.
- **Error handling:** All HTTP errors handled via a global Angular HTTP interceptor. User-facing messages shown via toast (top-right, auto-dismiss 4 s).

## Key Decisions

- **Redis cache only for point lookups and expensive aggregates** — Cache `findById` (contacts, deals) and `getStats` (deals) with TTL 24 h. Do NOT cache paginated list endpoints (`findAll`, `findByContactId`, `findByDealId`) — these always read directly from the DB. On update/delete, evict only the specific ID key (`contacts:id:<id>`, `deals:id:<id>`). On create/delete of a deal, also evict `deals:stats`. Pattern-based cache scanning (`KEYS`) is prohibited — use specific key deletes only.
- **Java 21 LTS for backend** — Chosen for long support window (until 2031) and Spring Boot 3.3.x compatibility. Use `JAVA_HOME`, not the system `java` (which is Java 8).
- **Angular standalone components** — All components use `standalone: true`. No NgModules for feature code.
- **JWT in localStorage** — Token attached to requests via HTTP interceptor. Cleared on 401/403. Redirects to `/login` on expiry.
- **Hard delete for Contacts** — Deleting a Contact removes the Contact record and any directly-linked Activities. Tasks are preserved with their Contact reference cleared (CON-03).
- **Company management deferred** — Companies are a read-only id+name lookup for the Contact form. Full company CRUD (COM-02, COM-03) is out of scope for this release.
- **Activity editing deferred** — Users can delete but not edit an existing Activity. Author-restricted deletion is also deferred (ACT-04).
- **Desktop-only** — Minimum supported width is 1280 px. Mobile and tablet layouts are explicitly out of scope.

## Notes

- The design token reference (colours, spacing, typography, elevation) lives in `docs/DESIGN.md` §3. Agents must use these CSS custom properties — never hardcode values.
- Drawers (400 px, right-slide) are used for: Deal form, Activity form, Task form, Tag creation. Full pages are used for: Contact create/edit and Contact detail.
- Optimistic UI applies to: task complete toggle and Kanban drag-and-drop stage changes. Both must revert on server error with a toast.
- All destructive actions (delete) require a confirmation dialog before proceeding (NFR-U03).
- The `docs/` folder contains `REQUIREMENTS.md` (v1.1) and `DESIGN.md` (v1.0) — these are the source of truth for feature scope and UI specification.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
