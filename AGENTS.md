# AGENTS

This project uses three main agent modes to support a spec-driven workflow:

## 1. Explore Mode
- **Purpose:** Analyze and document the codebase without making any code changes.
- **Output:** Writes a comprehensive exploration report to `.specs/project.md`.
- **Usage:** Use this mode to gather context, document patterns, and prepare for planning and implementation.

## 2. Plan Mode
- **Purpose:** Guide the creation and refinement of feature specs (requirements, design, tasks) in `.specs`.
- **Usage:** Use this mode to iteratively develop and approve specs before any implementation work begins.

## 3. Build Mode
- **Purpose:** Implement features strictly according to the approved specs in `.specs`.
- **Usage:** Use this mode to execute tasks, write code, and ensure all work aligns with the requirements and design in `.specs`.

---

## The `.specs` Directory
- All planning, design, and exploration artifacts are stored in the `.specs` directory.
- The main project exploration report is at `.specs/project.md` (created by explore mode).
- Each feature has its own subdirectory under `.specs/{feature_name}/` containing `requirements.md`, `design.md`, and `tasks.md` (created and managed by plan mode).
- Build mode references these files to guide implementation.

---

For more details on each mode, see the corresponding prompt files in `./prompts/`. 