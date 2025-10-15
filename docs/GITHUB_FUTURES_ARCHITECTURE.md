# GitHub-Based Possible Futures Architecture

## Revolutionary Approach

Instead of SQLite, use **GitHub as the database**:

```
Traditional Approach:
Idea → SQLite database → State changes → Query

GitHub-Based Approach:
Idea → GitHub repository → Commits (decisions) → Git history
```

## Core Concept

### Each Idea = Repository

```
User: "I want to build a marketplace"
↓
AI Cofounder: Creates GitHub repo "idea-marketplace-abc123"
├── README.md (Idea description)
├── REQUIREMENTS.md (Essential state)
├── ASSUMPTIONS.md (World assumptions)
├── GOALS.md (Measurable outcomes)
└── DECISIONS.log (All decisions made)
```

### Each Waterfall Stage = Branch

```
idea-marketplace-abc123/
├── requirements (branch) ← Initial specs
├── analysis (branch) ← Analysis from requirements
├── design (branch) ← Design from analysis
├── implementation (branch) ← Code from design
│   ├── develop (sub-branch) ← Active development
│   └── production (sub-branch) ← Production code
├── testing (branch) ← Tests and validation
├── validation (branch) ← Goal validation
└── deployment (branch) ← Deployment configs
```

### Each Decision = Commit

```
commit abc123
Author: AI Cofounder <ai@cofounder.com>
Date: 2025-10-15 10:00:00

decision: use-postgresql-for-database

Decision Type: technology_choice
Alternatives Considered: MySQL, SQLite, MongoDB
Chosen: PostgreSQL
Reason: Strong ACID guarantees, JSON support, proven at scale
Confidence: 0.85
Revisit Probability: 0.05 (very unlikely to change)

Files changed:
+ REQUIREMENTS.md (add database section)
+ DECISIONS.log (record this decision)
```

## Branch Strategy

### Waterfall Branches (Read-Only After Completion)

```
requirements ─┐
              ├─→ analysis ─┐
              │             ├─→ design ─┐
              │             │           ├─→ implementation ─┐
              │             │           │                   ├─→ testing ─┐
              │             │           │                   │            ├─→ validation
              │             │           │                   │            │
              └─────────────┴───────────┴───────────────────┴────────────┘
                        (each stage builds on previous)
```

### Implementation Sub-Branches (Active Development)

```
implementation/
├── develop ─────┐
│   ├── feature/user-auth
│   ├── feature/payments
│   └── fix/login-bug
│                │
└── production ──┘ (merges from develop)
```

### Stage Transitions (Pull Requests)

```
requirements branch complete
    ↓
Create PR: requirements → analysis
    ↓
AI generates analysis from requirements
    ↓
Commits to analysis branch
    ↓
Tests pass
    ↓
PR auto-merges
    ↓
Triggers next stage (analysis → design)
```

## Decision Tracking

### Decision Format

Every decision is a commit with structured message:

```
decision: <short-name>

Decision Type: <type>
Alternatives Considered: <list>
Chosen: <choice>
Reason: <explanation>
Confidence: <0.0-1.0>
Revisit Probability: <0.0-1.0>
Context: <relevant context>
Trade-offs: <what we're giving up>
Consequences: <what this enables/prevents>

[optional detailed analysis]
```

### Decision Types

- `technology_choice` - Tech stack decisions
- `architecture` - Structural decisions
- `feature_scope` - What to build
- `business_model` - How to monetize
- `resource_allocation` - Where to spend time
- `assumption_validation` - Validation results
- `goal_prioritization` - Which goals first

### Never Repeat Decisions

Before making a decision:

```bash
# AI checks git history
git log --all --grep="decision: use-database"

# If decision already made:
- Show previous decision
- Show reasoning
- Ask: "Has context changed enough to revisit?"
- If yes: Document why reversal needed
- If no: Use previous decision
```

### Reversal Conditions

Decision can be revisited if:

```python
def should_revisit_decision(decision):
    # Only revisit if high probability it helps reach next goal
    if goal_blocked and decision.revisit_probability > 0.7:
        return True
    
    # Or if new information invalidates assumption
    if assumption_invalidated and decision.depends_on(assumption):
        return True
    
    # Otherwise, keep the decision
    return False
```

## Onboarding Flow

### 1. User Links GitHub Account

```typescript
// OAuth flow
const githubAuth = await authenticateGitHub();

// Get user's GitHub username
const user = await github.users.getAuthenticated();

// Store credentials
await saveGitHubToken(user.login, githubAuth.token);
```

### 2. AI Creates Organization (Optional)

```typescript
// Create org for user's ideas
const org = await github.orgs.create({
  name: `${user.login}-ideas`,
  description: 'Possible Futures managed by AI Cofounder'
});
```

### 3. For Each Idea: Create Repository

```typescript
// User: "I want to build a marketplace"
const idea = await createIdea('marketplace', 'E-commerce platform');

// AI creates repo
const repo = await github.repos.createForAuthenticatedUser({
  name: `idea-marketplace-${idea.id}`,
  description: idea.description,
  private: true,
  auto_init: true
});

// AI creates all waterfall branches
await createWaterfallBranches(repo);
```

## Mastra Workflow: Waterfall Automation

### Workflow Trigger

```yaml
# .github/workflows/waterfall.yml
name: Waterfall Progression

on:
  push:
    branches:
      - requirements
      - analysis
      - design
      - implementation
      - testing
      - validation

jobs:
  progress-waterfall:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Trigger Mastra Workflow
        uses: mastra/workflow-action@v1
        with:
          workflow: waterfall-progression
          stage: ${{ github.ref_name }}
```

### Mastra Workflow Definition

```typescript
// mastra-workflows/waterfall-progression.ts

export const waterfallProgression = new Workflow({
  name: 'waterfall-progression',
  
  trigger: {
    type: 'github_push',
    branches: ['requirements', 'analysis', 'design', 'implementation', 'testing', 'validation']
  },
  
  steps: [
    {
      name: 'detect-stage',
      action: async ({ context }) => {
        const currentStage = context.branch;
        const nextStage = getNextStage(currentStage);
        return { currentStage, nextStage };
      }
    },
    
    {
      name: 'check-stage-complete',
      action: async ({ context, results }) => {
        const { currentStage } = results['detect-stage'];
        
        // Check if stage is complete
        const complete = await isStageComplete(currentStage);
        
        if (!complete) {
          return { shouldProgress: false, reason: 'Stage not complete' };
        }
        
        return { shouldProgress: true };
      }
    },
    
    {
      name: 'generate-next-stage',
      condition: ({ results }) => results['check-stage-complete'].shouldProgress,
      action: async ({ context, results }) => {
        const { nextStage } = results['detect-stage'];
        
        // AI generates content for next stage
        const generated = await generateStageContent(nextStage);
        
        return { generated };
      }
    },
    
    {
      name: 'create-pr',
      condition: ({ results }) => results['check-stage-complete'].shouldProgress,
      action: async ({ context, results }) => {
        const { currentStage, nextStage } = results['detect-stage'];
        const { generated } = results['generate-next-stage'];
        
        // Create PR from current → next stage
        const pr = await createWaterfallPR(
          currentStage,
          nextStage,
          generated
        );
        
        return { pr };
      }
    },
    
    {
      name: 'auto-review',
      condition: ({ results }) => results['create-pr'],
      action: async ({ results }) => {
        const { pr } = results['create-pr'];
        
        // AI reviews the PR
        const review = await aiReviewPR(pr);
        
        if (review.approved) {
          await github.pulls.merge(pr.number, {
            merge_method: 'squash'
          });
        }
        
        return { review };
      }
    }
  ]
});
```

## Benefits of GitHub-Based Approach

### 1. Immutable Decision History

```bash
# View all decisions
git log --all --grep="decision:"

# View decisions for specific topic
git log --all --grep="decision: use-.*-database"

# See when decision was made and why
git show abc123
```

### 2. Never Repeat Decisions

```typescript
async function makeDecision(topic: string, options: string[]) {
  // Check if already decided
  const previousDecision = await findDecision(topic);
  
  if (previousDecision) {
    console.log(`Already decided: ${previousDecision.chosen}`);
    console.log(`Reason: ${previousDecision.reason}`);
    console.log(`Confidence: ${previousDecision.confidence}`);
    
    // Only revisit if high probability of reversal
    if (shouldRevisitDecision(previousDecision, currentGoals)) {
      console.log('Revisiting decision (goal blocked)...');
      return await makeNewDecision(topic, options, previousDecision);
    }
    
    return previousDecision;
  }
  
  // New decision
  return await makeNewDecision(topic, options);
}
```

### 3. Natural Audit Trail

```bash
# Complete history
git log --oneline

# Who made what decision when
git log --all --pretty=format:"%h %an %ad %s"

# What changed in requirements
git diff requirements..analysis
```

### 4. Collaboration Support

```bash
# User can review any branch
# User can comment on commits
# User can approve PRs
# AI proposes, user approves
```

### 5. Backup & Sync

```bash
# GitHub = automatic backup
# Can clone anywhere
# Can work offline
# Sync when online
```

## Example: Creating an Idea

### Step 1: User Links GitHub

```typescript
// OAuth flow
const auth = await authenticateGitHub(user);

// Store token securely
await saveCredential(user.id, 'github_token', auth.token);
```

### Step 2: AI Creates Repository

```typescript
// User: "I want to build a SaaS analytics platform"
const idea = {
  name: 'SaaS Analytics Platform',
  description: 'Real-time analytics for SaaS businesses',
  id: generateId() // abc123
};

// Create GitHub repo
const repo = await github.repos.createForAuthenticatedUser({
  name: `idea-saas-analytics-${idea.id}`,
  description: idea.description,
  private: true,
  auto_init: true
});
```

### Step 3: Create Waterfall Branches

```typescript
// Create all stage branches from main
const stages = [
  'requirements',
  'analysis', 
  'design',
  'implementation',
  'testing',
  'validation',
  'deployment'
];

for (const stage of stages) {
  await github.git.createRef({
    owner: user.login,
    repo: repo.name,
    ref: `refs/heads/${stage}`,
    sha: mainBranchSHA
  });
}

// For implementation, create sub-branches
await github.git.createRef({
  ref: 'refs/heads/implementation/develop',
  sha: implementationBranchSHA
});

await github.git.createRef({
  ref: 'refs/heads/implementation/production',
  sha: implementationBranchSHA
});
```

### Step 4: Initialize Requirements

```typescript
// Commit initial requirements to requirements branch
await github.repos.createOrUpdateFileContents({
  owner: user.login,
  repo: repo.name,
  path: 'REQUIREMENTS.md',
  message: 'decision: initial-requirements

Decision Type: feature_scope
...',
  content: Buffer.from(requirementsContent).toString('base64'),
  branch: 'requirements'
});
```

## Mastra Workflow Details

### Workflow: Requirements Changed

```typescript
// When requirements branch updated
export const requirementsChanged = new Workflow({
  name: 'requirements-changed',
  
  trigger: {
    type: 'github_push',
    branch: 'requirements'
  },
  
  steps: [
    // 1. Extract what changed
    {
      name: 'extract-changes',
      action: async ({ context }) => {
        const diff = await getCommitDiff(context.sha);
        const decisions = extractDecisions(diff);
        return { decisions };
      }
    },
    
    // 2. Check if should progress to analysis
    {
      name: 'check-completeness',
      action: async ({ context }) => {
        const requirements = await loadFile('REQUIREMENTS.md', 'requirements');
        const assumptions = await loadFile('ASSUMPTIONS.md', 'requirements');
        const goals = await loadFile('GOALS.md', 'requirements');
        
        // Calculate if ready to progress
        const critical = assumptions.filter(a => a.criticality > 0.7);
        const validated = critical.filter(a => a.validated).length;
        const complete = validated / critical.length >= 0.8;
        
        return { complete, validated, total: critical.length };
      }
    },
    
    // 3. Generate analysis (if complete)
    {
      name: 'generate-analysis',
      condition: ({ results }) => results['check-completeness'].complete,
      action: async ({ context }) => {
        // AI agent generates analysis from requirements
        const requirements = await loadAllFiles('requirements');
        const analysis = await aiAgent.generateAnalysis(requirements);
        
        return { analysis };
      }
    },
    
    // 4. Create PR to analysis branch
    {
      name: 'create-analysis-pr',
      condition: ({ results }) => results['generate-analysis'],
      action: async ({ results }) => {
        const { analysis } = results['generate-analysis'];
        
        // Commit to analysis branch
        await commitFiles('analysis', {
          'ANALYSIS.md': analysis.content,
          'DECISIONS.log': analysis.decisions
        }, 'decision: generate-analysis-from-requirements');
        
        // Create PR
        const pr = await github.pulls.create({
          head: 'analysis',
          base: 'design',
          title: 'Analysis → Design: Ready for next stage',
          body: generatePRDescription(analysis)
        });
        
        return { pr };
      }
    },
    
    // 5. Auto-approve if validations pass
    {
      name: 'auto-approve',
      condition: ({ results }) => results['create-analysis-pr'],
      action: async ({ results }) => {
        const { pr } = results['create-analysis-pr'];
        
        // Run validations
        const checks = await runChecks(pr);
        
        if (checks.allPass) {
          await github.pulls.merge(pr.number, {
            merge_method: 'squash'
          });
          
          // This triggers the next workflow (analysis changed)
          return { merged: true };
        }
        
        return { merged: false, blockers: checks.failures };
      }
    }
  ]
});
```

### Workflow: Implementation Changed

```typescript
export const implementationChanged = new Workflow({
  name: 'implementation-changed',
  
  trigger: {
    type: 'github_push',
    branch: 'implementation/develop'
  },
  
  steps: [
    // 1. Run tests
    {
      name: 'run-tests',
      action: async ({ context }) => {
        const testResults = await runAllTests();
        return { testResults };
      }
    },
    
    // 2. If tests pass, can merge to production
    {
      name: 'check-production-ready',
      condition: ({ results }) => results['run-tests'].testResults.success,
      action: async ({ context }) => {
        // Check if goals are met
        const goals = await loadGoals();
        const validation = await validateGoals(goals);
        
        return { ready: validation.allPass };
      }
    },
    
    // 3. Create PR to production
    {
      name: 'create-production-pr',
      condition: ({ results }) => results['check-production-ready'].ready,
      action: async () => {
        const pr = await github.pulls.create({
          head: 'implementation/develop',
          base: 'implementation/production',
          title: 'Deploy to Production',
          body: 'All tests pass, goals validated, ready for production'
        });
        
        return { pr };
      }
    }
  ]
});
```

## Repository Structure

### Idea Repository Contents

```
idea-saas-analytics-abc123/
├── README.md                  (Idea overview)
├── REQUIREMENTS.md            (What we're building)
├── ASSUMPTIONS.md             (What we're assuming)
├── GOALS.md                   (Measurable outcomes)
├── DECISIONS.log              (All decisions made)
├── COMPONENTS.md              (System components)
│
├── analysis/
│   ├── ANALYSIS.md           (Analysis results)
│   ├── USER_PERSONAS.md      (Target users)
│   └── MARKET_ANALYSIS.md    (Market research)
│
├── design/
│   ├── ARCHITECTURE.md       (System architecture)
│   ├── DATABASE_SCHEMA.md    (Data models)
│   └── API_DESIGN.md         (API specifications)
│
├── implementation/
│   ├── src/                  (Source code)
│   ├── tests/                (Test files)
│   └── docs/                 (Code documentation)
│
├── testing/
│   ├── TEST_PLAN.md          (Testing strategy)
│   ├── TEST_RESULTS.md       (Results)
│   └── test-reports/         (Detailed reports)
│
├── validation/
│   ├── VALIDATION_RESULTS.md (Goal validation)
│   └── METRICS.md            (Current metrics)
│
└── deployment/
    ├── DEPLOYMENT_GUIDE.md   (How to deploy)
    ├── docker-compose.yml    (Deployment config)
    └── .env.example          (Required secrets)
```

### DECISIONS.log Format

```
[2025-10-15 10:00:00] decision: use-postgresql
  Type: technology_choice
  Confidence: 0.85
  Revisit Probability: 0.05
  Commit: abc123
  
[2025-10-15 10:15:00] decision: use-react-frontend
  Type: technology_choice
  Confidence: 0.90
  Revisit Probability: 0.10
  Commit: def456
  
[2025-10-15 10:30:00] decision: target-smb-market
  Type: business_model
  Confidence: 0.70
  Revisit Probability: 0.40
  Commit: ghi789
```

## Benefits

### 1. Immutable History

Git commits are immutable. Decisions can't be changed, only reversed with new commits.

### 2. Built-in Backup

GitHub = automatic backup. Every decision is safe.

### 3. Collaboration

- User can view any branch
- User can comment on commits
- User can approve PRs
- AI proposes, user decides

### 4. Offline Support

```bash
git clone <repo>
# Work offline
git commit
# Sync later
git push
```

### 5. Audit Trail

```bash
# Who decided what when
git log --all

# What changed
git diff requirements..analysis

# Why it changed
git show abc123
```

### 6. No Database Migrations

Branches replace database. Schema is implicit in file structure.

### 7. CI/CD Native

GitHub Actions trigger on branch changes. Waterfall automation is natural.

## Comparison

| Aspect | SQLite Approach | GitHub Approach |
|--------|----------------|-----------------|
| **Storage** | SQLite files | Git repositories |
| **State** | Rows in tables | Files in branches |
| **Changes** | Insert events | Git commits |
| **History** | Query events | Git log |
| **Branches** | N/A | Native (waterfall stages) |
| **Backup** | Manual | Automatic (GitHub) |
| **Collaboration** | Complex | Native (PRs, comments) |
| **Audit** | Custom | Built-in (git log) |
| **Offline** | Yes | Yes (git clone) |
| **CI/CD** | External | Native (Actions) |

## Migration Strategy

### From SQLite to GitHub

```typescript
// For each idea in SQLite
for (const idea of sqliteIdeas) {
  // 1. Create GitHub repo
  const repo = await createRepo(idea);
  
  // 2. Create branches
  await createWaterfallBranches(repo);
  
  // 3. Migrate data to markdown files
  await commitFile(repo, 'requirements', 'REQUIREMENTS.md', idea.requirements);
  await commitFile(repo, 'requirements', 'ASSUMPTIONS.md', idea.assumptions);
  await commitFile(repo, 'requirements', 'GOALS.md', idea.goals);
  
  // 4. Recreate decision history
  for (const change of idea.changes) {
    await commitDecision(repo, change);
  }
  
  // 5. Update idea record to point to GitHub
  idea.storage_type = 'github';
  idea.github_repo = repo.full_name;
}
```

## Implementation Priority

1. **GitHub OAuth integration** (authentication)
2. **Repository creation** (idea = repo)
3. **Branch management** (waterfall stages)
4. **Decision tracking** (commit format)
5. **Mastra workflow** (automation)
6. **PR automation** (stage transitions)
7. **Migrate existing ideas** (SQLite → GitHub)
