# Pre-Commit Standards

## Purpose

This document defines the automated quality checks that run before every commit. These checks prevent broken code from entering the repository and save time by catching issues early.

## What Runs on Every Commit

When you run `git commit`, the following checks execute automatically via **Husky** and **lint-staged**:

### 1. **ESLint** - Code Quality
- Runs on all `.ts`, `.tsx`, `.js`, `.jsx` files
- Auto-fixes issues when possible
- **Zero warnings policy** (`--max-warnings=0`)
- Catches:
  - Unused variables/imports
  - Type errors
  - Code style violations
  - Potential bugs

### 2. **Prettier** - Code Formatting
- Runs on all code and config files
- Auto-formats to consistent style
- Ensures:
  - Consistent indentation (2 spaces)
  - Single quotes for strings
  - Semicolons
  - Line length < 100 chars
  - Unix line endings (LF)

### 3. **TypeScript Type Checking**
- Runs `tsc --noEmit` on changed TypeScript files
- Catches:
  - Type mismatches
  - Missing imports
  - Invalid property access
  - Configuration errors

## Common Issues Caught

### ❌ Unused Imports (Auto-fixed)
```typescript
import React from 'react';  // ← Removed if not used

function Component() {
  return <div>Hello</div>;
}
```

### ❌ Type Errors (Must fix manually)
```typescript
// Error: Property 'xyz' does not exist
const value = someObject.xyz;
```

### ❌ Inconsistent Formatting (Auto-fixed)
```typescript
// Before
function foo(){return "bar"}

// After
function foo() {
  return 'bar';
}
```

### ❌ Unused Variables (Must fix manually)
```typescript
// Error: 'unusedVar' is declared but never used
const unusedVar = 123;
```

## How It Works

### Architecture

```
git commit
    ↓
Husky pre-commit hook (.husky/pre-commit)
    ↓
lint-staged (.lintstagedrc.json)
    ↓
Runs checks ONLY on staged files
    ↓
ESLint → Prettier → TypeScript
    ↓
All pass? → Commit succeeds ✅
Any fail? → Commit blocked ❌
```

### What Gets Checked

**Only staged files** are checked (fast!):
- ✅ Files you're committing
- ❌ Not the entire codebase

This means commits are fast (~2-10 seconds) instead of slow (~60+ seconds).

## Bypassing Checks (⚠️ Use Sparingly)

In emergencies, you can skip pre-commit checks:

```bash
git commit --no-verify -m "emergency fix"
```

**When to use:**
- Production is down and you need to hotfix NOW
- Pre-commit hook is broken (rare)
- You're committing generated files that don't pass linting

**When NOT to use:**
- "I don't want to fix the linting errors" ← Fix them instead
- "It's taking too long" ← It's saving you time in code review
- "I'll fix it later" ← You won't, and neither will anyone else

## Configuration Files

### `.lintstagedrc.json`
Defines what runs on which files:
```json
{
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write",
    "bash -c 'pnpm exec tsc --noEmit'"
  ]
}
```

### `.eslintrc.json`
ESLint rules and configuration:
- TypeScript-aware parsing
- Catches unused vars (with `_` prefix exception)
- Warns on `any` types
- Allows `console.warn` and `console.error`

### `.prettierrc.json`
Code formatting rules:
- 2 spaces for indentation
- Single quotes
- Semicolons required
- 100 character line width
- Unix line endings

### `.husky/pre-commit`
Git hook that triggers the checks:
```bash
#!/usr/bin/env sh
pnpm lint-staged
```

## Manual Checks (Before Pushing)

These don't run automatically but are recommended:

### Full Build Test
```bash
# Test that everything compiles
pnpm run build
```

### Run Tests
```bash
# Backend unit tests
cd backend && pnpm test

# End-to-end tests
pnpm test:e2e
```

### Type Check Everything
```bash
# Check all TypeScript files (not just staged)
pnpm run type-check
```

## CI/CD Integration

GitHub Actions also runs these checks:
- On every pull request
- On every push to `main`
- Before deployment

So even if you bypass locally, CI will catch it.

## Troubleshooting

### "pnpm: command not found"

Install pnpm:
```bash
npm install -g pnpm
# or
brew install pnpm
```

### "Husky hooks not installing"

Reinstall hooks:
```bash
pnpm run prepare
```

### "ESLint errors I can't fix"

1. Try auto-fix:
   ```bash
   pnpm run lint:fix
   ```

2. If still failing, read the error message carefully
3. Ask for help if stuck (don't bypass!)

### "Type errors in node_modules"

Add to `.eslintignore` or `tsconfig.json` exclude list.

### "Pre-commit is too slow"

Check if you're running on too many files:
```bash
git status  # Only staged files should be checked
```

If it's genuinely slow, the config might need adjustment.

## Best Practices

### ✅ DO

- **Commit often** - Pre-commit checks are fast for small changes
- **Fix errors** - Don't bypass, fix the actual issues
- **Use auto-fix** - Run `pnpm run lint:fix` before committing
- **Test locally** - Run `pnpm run build` before pushing
- **Trust the tools** - They catch real bugs

### ❌ DON'T

- **Bypass frequently** - If you're always using `--no-verify`, something's wrong
- **Commit generated files** - Add them to `.gitignore` instead
- **Disable rules** - They exist for good reasons
- **Commit broken code** - "I'll fix it later" never happens
- **Ignore TypeScript errors** - They prevent runtime bugs

## Adding New Checks

To add a new pre-commit check:

1. **Add the tool** to `package.json` devDependencies
2. **Update `.lintstagedrc.json`** with the new command
3. **Test it** with a sample commit
4. **Document it** in this file

Example:
```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "your-new-tool"  // ← Add here
  ]
}
```

## Performance Tips

### Current Performance (Typical)
- Small commit (1-2 files): ~2-5 seconds
- Medium commit (5-10 files): ~5-10 seconds
- Large commit (20+ files): ~10-20 seconds

### If Too Slow

1. **Commit smaller chunks** - Don't commit 50 files at once
2. **Check staged files only** - Make sure lint-staged is working
3. **Skip type-check for huge commits** - Temporarily remove from lint-staged
4. **Parallelize** - Some checks can run in parallel (advanced)

## Why These Standards Matter

### Before Pre-Commit Checks
- Broken code merged to main ❌
- Code review wastes time on style ❌
- Type errors catch in production ❌
- Inconsistent code style ❌
- CI fails after you've moved on ❌

### After Pre-Commit Checks
- Only working code gets committed ✅
- Code review focuses on logic ✅
- Type errors caught immediately ✅
- Consistent code style ✅
- CI rarely fails ✅

## Integration with Docker Standards

These pre-commit checks complement the Docker standards:
- Docker ensures consistent builds
- Pre-commit ensures quality code
- Together = production-ready commits

See `DOCKER_STANDARDS.md` for build quality standards.

---

**Move fast. Break nothing. Ship quality.**

Last updated: 2025-10-15

