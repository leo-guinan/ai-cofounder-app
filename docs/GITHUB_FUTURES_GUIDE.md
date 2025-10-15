# GitHub-Based Possible Futures Guide

## Quick Start

### 1. Link GitHub Account

```bash
# In AI Cofounder app
User: "Link my GitHub account"
AI: Opens OAuth flow
User: Authorizes
AI: "✅ GitHub linked"
```

### 2. Create Your First Idea

```bash
User: "I want to build a marketplace for freelance designers"

AI: "Creating idea repository..."
# AI creates: idea-marketplace-designers-abc123
# With branches: requirements, analysis, design, etc.

AI: "✅ Created idea repository at:
     https://github.com/yourusername/idea-marketplace-designers-abc123"
```

### 3. Make Decisions

```bash
User: "What database should we use?"

AI: Checking decision history...
# git log --grep="decision: use-.*-database"
# No previous decision found

AI: "Let's decide. Options: PostgreSQL, MySQL, MongoDB

Based on your requirements:
- Need ACID guarantees
- JSON support useful
- Proven at scale

I recommend PostgreSQL.

Shall I commit this decision?"

User: "Yes"

AI: Making decision...
# Commits to requirements branch
# decision: use-postgresql-database
# Confidence: 0.85
# Revisit Probability: 0.05 (very unlikely to change)

AI: "✅ Decision committed. You won't need to decide this again."
```

### 4. Progress Through Waterfall

```bash
# When requirements complete
AI: "Requirements stage complete!
     - All components defined
     - 4/5 critical assumptions validated
     - 3 measurable goals set
     
     Creating analysis..."

# Mastra workflow triggers
# AI generates analysis from requirements
# Commits to analysis branch
# Creates PR: requirements → analysis
# Auto-reviews and merges

AI: "✅ Progressed to Analysis stage"
```

## Repository Structure

### Idea Repository

```
idea-marketplace-abc123/
├── .github/
│   └── workflows/
│       └── waterfall-trigger.yml
│
├── README.md (Idea overview)
│
├── requirements branch:
│   ├── REQUIREMENTS.md
│   ├── ASSUMPTIONS.md
│   ├── GOALS.md
│   ├── COMPONENTS.md
│   └── DECISIONS.log
│
├── analysis branch:
│   ├── ANALYSIS.md
│   ├── USER_PERSONAS.md
│   ├── MARKET_ANALYSIS.md
│   └── DECISIONS.log
│
├── design branch:
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DESIGN.md
│   └── DECISIONS.log
│
├── implementation branch:
│   ├── develop branch:
│   │   ├── src/
│   │   ├── tests/
│   │   └── DECISIONS.log
│   │
│   └── production branch:
│       └── (merges from develop)
│
├── testing branch:
│   ├── TEST_PLAN.md
│   ├── TEST_RESULTS.md
│   └── DECISIONS.log
│
├── validation branch:
│   ├── VALIDATION_RESULTS.md
│   ├── METRICS.md
│   └── DECISIONS.log
│
└── deployment branch:
    ├── DEPLOYMENT_GUIDE.md
    ├── docker-compose.yml
    └── DECISIONS.log
```

## Decision Format

### Commit Message Structure

```
decision: <short-kebab-case-name>

Decision Type: <type>
Alternatives Considered: <option1>, <option2>, <option3>
Chosen: <selected-option>
Reason: <why-this-option>
Confidence: <0.0-1.0>
Revisit Probability: <0.0-1.0>
Context: <relevant-context>

[Optional detailed analysis in commit body]
```

### Example Decision Commits

```
commit abc123
decision: use-stripe-for-payments

Decision Type: technology_choice
Alternatives Considered: Stripe, PayPal, Square
Chosen: Stripe
Reason: Best API, widest coverage, easy integration
Confidence: 0.90
Revisit Probability: 0.10
Context: Need payment processing for marketplace transactions

---

commit def456
decision: target-smb-market-first

Decision Type: business_model
Alternatives Considered: Enterprise, SMB, Consumer
Chosen: SMB
Reason: Faster sales cycle, less customization needed
Confidence: 0.70
Revisit Probability: 0.40
Context: Limited resources, need revenue soon

This has higher revisit probability because market targeting
often needs adjustment based on early customer feedback.
```

## Never Repeat Decisions

### AI Always Checks History

```typescript
// Before making decision
const existing = await github.findDecision(repo, 'use-database');

if (existing) {
  if (existing.revisitProbability < 0.7) {
    return existing; // Use previous decision
  }
  
  // Only if high revisit probability AND goal blocked
  if (isGoalBlocked() && existing.revisitProbability >= 0.7) {
    return await revisitDecision(existing);
  }
  
  return existing;
}

// New decision
return await makeNewDecision();
```

### Viewing Decision History

```bash
# All decisions
git log --all --grep="decision:" --oneline

# Decisions for specific topic
git log --all --grep="decision: use-.*-database"

# Decision details
git show abc123

# When decision was made
git log --all --grep="decision: use-stripe" --format="%ai %s"
```

## Stage Transitions

### Automatic Progression

```
1. Requirements branch updated
   ↓
2. Mastra workflow triggered (GitHub Action)
   ↓
3. Check if requirements complete
   ├─ All sections filled
   ├─ Critical assumptions validated (≥80%)
   └─ Goals defined
   ↓
4. If complete: Generate analysis
   ├─ AI reads all requirements
   ├─ AI generates analysis
   └─ AI commits to analysis branch
   ↓
5. Create PR: requirements → analysis
   ↓
6. AI reviews PR
   ↓
7. If approved: Auto-merge
   ↓
8. Analysis branch updated
   ↓
9. Repeat for next stage (analysis → design)
```

### Manual Approval (Optional)

```yaml
# In workflow
- name: Request approval
  if: ${{ env.REQUIRE_HUMAN_APPROVAL == 'true' }}
  uses: trstringer/manual-approval@v1
  with:
    approvers: user@example.com
    minimum-approvals: 1
```

## Implementation Branches

### Development Flow

```
implementation/develop ← Active development
├── feature/user-auth
├── feature/payments
└── fix/login-bug
      ↓ (when ready)
      PR to develop
      ↓ (tests pass)
      Merge to develop
      ↓ (staging deploy)
      Test in staging
      ↓ (goals validated)
      PR to production
      ↓ (final approval)
      Merge to production
      ↓ (production deploy)
```

### Production Deployment

```
implementation/production
↓
Only merged from develop
↓
Triggers production deployment
↓
Telemetry monitors
↓
Validates goals
```

## Benefits

### 1. Immutable History

Git commits can't be changed. Decisions are permanent (unless explicitly reversed).

### 2. Never Repeat

AI checks history before every decision. If already decided, reuse.

### 3. Single Decision Point

Founder makes each decision exactly once. System remembers forever.

### 4. Automatic Progression

Mastra workflows handle stage transitions automatically.

### 5. Natural CI/CD

GitHub Actions trigger on branch changes. Testing and deployment built-in.

### 6. Collaboration

- Founder can view any branch
- Founder can comment on commits
- Founder approves stage transitions
- AI proposes, founder decides

### 7. Backup Built-In

GitHub = automatic backup. Every decision is safe.

## Example Workflow

### User Creates Idea

```
User: "I want to build a SaaS analytics platform"

AI: "Creating idea repository..."
# Creates: idea-saas-analytics-abc123
# Branches: requirements, analysis, ..., deployment

AI: "What's the primary goal?"

User: "Get to $10k MRR in 6 months"

AI: "Adding goal..."
# Commits to requirements branch
# decision: target-10k-mrr-6months
# Type: goal_prioritization

AI: "What database should we use?"

User: "PostgreSQL"

AI: "Adding database decision..."
# Checks history first (none found)
# Commits decision
# decision: use-postgresql-database

AI: "Who is the target user?"

User: "SaaS founders who need better analytics"

AI: "Adding user persona..."
# Commits decision
# decision: target-saas-founders

AI: "Requirements stage complete!
     - All components defined ✓
     - 3/4 critical assumptions validated ✓
     - Goal set ✓
     
     Generating analysis..."

# Mastra workflow triggers
# AI generates analysis from requirements
# Creates PR: requirements → analysis
# Auto-merges after validation

AI: "✅ Analysis complete. Progressing to design..."
```

## Migration from SQLite

### One-Time Migration

```typescript
// For each SQLite idea
for (const idea of sqliteIdeas) {
  // 1. Create GitHub repo
  const repo = await github.createIdea(idea.name, idea.description);
  
  // 2. Recreate decision history as commits
  for (const change of idea.changes) {
    await github.commitDecision(repo, change);
  }
  
  // 3. Update idea record
  await db.update('ideas', idea.id, {
    storage_type: 'github',
    github_repo: repo.full_name
  });
}
```

## FAQ

### Q: What if I want to change a decision?

**A**: Create a new commit reversing the decision:

```
commit xyz789
decision-reversal: use-postgresql-database

Original Decision: Use PostgreSQL
Original Confidence: 0.85
Reversal Reason: Need MongoDB for flexible schema
New Choice: MongoDB
Context: Requirements changed significantly, ACID less important than flexibility
```

### Q: How do I know what decisions were made?

**A**: Check DECISIONS.log or git history:

```bash
# View decisions
cat DECISIONS.log

# Or
git log --grep="decision:"
```

### Q: Can I work offline?

**A**: Yes! Clone the repo, work offline, push when online:

```bash
git clone <repo>
# Work offline
git commit -m "decision: ..."
# Later
git push
```

### Q: What if waterfall gets stuck?

**A**: Review the stage branch, identify blocker, add info, workflow retriggers.
