## Rules
- Never read .env or .dev.vars files
- Never attempt to create or write secrets. Ask the user to do this as a follow up manual step.

## Explore

### 1. Understand Current Context
- **Check git status**: Review current branch and working directory status
- **Analyze branch changes**: If not on master, use `git diff master...HEAD` and `git log master..HEAD` to understand recent work
- **Review project structure**: Read key files (README, package.json, pom.xml, static_conf.json)

### 2. Research Codebase Patterns
- Look through the codebase and understand the patterns. Examine the libraries used.


### 4. Document Findings
- **Create exploration report**: Write comprehensive findings to `./plan/notes.md`
- **Include context**: Document branch status, project structure, patterns found, 
- **Prepare for planning**: Summarize key insights and recommended approaches

### Important Notes
- **NO CODE WRITING** during this phase
- **EXPLORATION ONLY** - do not write, edit, or modify any code files
- **USE SUBAGENTS** liberally for complex investigations
- **OUTPUT TO** `notes.md` for next phase

## Plan

### 1. Gather Context
- **Read exploration context**: Load `./plan/notes.md` for codebase insights and patterns
- **Understand current state**: Review what's been discovered and what needs implementation

### 2. Analyze with Extended Thinking
- **Apply thinking mode**: Use specified level (think/think hard/think harder/ultrathink) for problem analysis
- **Evaluate approaches**: Consider multiple implementation strategies and trade-offs
- **Assess simplicity**: Prioritize simple solutions that leverage existing code

### 3. Create Implementation Plan
- **Break down tasks**: Create specific, actionable steps with dependencies and risk levels. Record in `./plan/plan.md`
- **Include testing strategy**: Plan for validation and acceptance criteria

### Important Notes
- **NO CODE IMPLEMENTATION** during this phase
- **PLANNING ONLY** - do not write, edit, or modify any code files
- **THINK HARD** by default for thorough analysis
- **READ EXPLORATION** context from `./plan/notes.md`
- **OUTPUT PLANS to** `./plan/:feature-name.md`
- **GITHUB INTEGRATION** - plan becomes part of issue/PR discussion

## Code

### 1. Load Context
- **Read the plan**: check local plan.md
- **Load todo list**: Load the todo list from the plan.md file

### 2. Execute Plan Systematically
- **Work sequentially**: Mark one todo as in_progress at a time
- **Complete fully**: Finish each todo completely before moving to next
- **Mark progress immediately**: Update todo status as soon as task is done

### 3. Handle Implementation
- **Test incrementally**: Validate implementation as you go
- **Adapt when needed**: Update todos if requirements change during implementation
- **Apply simplicity principles**: Use simplest approach that leverages existing code

### 4. Final Validation
- **Fix failures**: Address any issues before marking implementation complete
- **Ensure completion**: Verify all todos are completed and nothing left in_progress

## Important Notes
- **ACTUAL CODE IMPLEMENTATION** happens in this phase
- **ONE TODO IN_PROGRESS** at a time to maintain focus
- **MARK COMPLETE IMMEDIATELY** after finishing each task
- **Move complete plans into the `./plan/completed` folder**