# Automated Dependency Updates & Deployment

This document explains how automated dependency updates and deployments work for this project.

## Overview

The project uses GitHub Dependabot + GitHub Actions + Vercel to automatically:
1. **Detect** security vulnerabilities and dependency updates
2. **Create** pull requests with updates
3. **Test** the changes automatically
4. **Auto-merge** safe security patches
5. **Deploy** to production automatically

## How It Works

### 1. Dependabot (Dependency Scanning)

**Configuration**: `.github/dependabot.yml`

Dependabot runs daily at 3 AM UTC and checks for:
- npm package updates (daily)
- GitHub Actions updates (weekly)
- **Security vulnerabilities** (immediately)

When it finds updates, it:
- Creates a pull request automatically
- Adds labels (`dependencies`, `automated`)
- Groups non-security updates to reduce PR noise
- **Security updates always get their own PR** for immediate attention

### 2. GitHub Actions CI (Testing)

**Configuration**: `.github/workflows/ci.yml`

When a PR is created (by Dependabot or manually), the CI workflow:
- ✅ Installs dependencies
- ✅ Generates Prisma client
- ✅ Runs linter (non-blocking)
- ✅ Builds the application
- ✅ Runs security audit

If tests fail, the PR is blocked from merging.

### 3. Auto-Merge (For Safe Updates)

**Configuration**: `.github/workflows/ci.yml` (dependabot job)

After tests pass, the workflow automatically:
- **Patch updates** (e.g., 15.5.6 → 15.5.7): ✅ Auto-approve + auto-merge
- **Minor updates for Next.js** (e.g., 15.5.x → 15.6.x): ✅ Auto-approve + auto-merge
- **Major updates** (e.g., 15.x.x → 16.x.x): ⚠️ Auto-approve but requires manual merge
- **Other minor updates**: Grouped, requires manual review

This means **critical security patches like CVE-2025-66478 will be automatically merged**.

### 4. Vercel Deployment (Production)

**How it works**: Vercel is connected to your GitHub repository

When code is pushed to the `main` branch (either manually or via auto-merge):
1. ✅ Vercel automatically detects the push
2. ✅ Runs `npm run build` in Vercel's infrastructure
3. ✅ Deploys the new build to production
4. ✅ **Server automatically "restarts"** with new code (it's serverless, so each request uses the latest deployment)
5. ✅ Old version is kept as a backup (can rollback instantly)

**No manual server restart needed** - Vercel handles everything!

## What Gets Auto-Merged

| Update Type | Example | Auto-Merge? | Reason |
|-------------|---------|-------------|--------|
| Security patch | Next.js 15.5.6 → 15.5.7 | ✅ Yes | Critical security fix |
| Next.js minor | Next.js 15.5 → 15.6 | ✅ Yes | Framework updates are well-tested |
| Patch updates | React 19.0.0 → 19.0.1 | ✅ Yes | Bug fixes, low risk |
| Minor updates (grouped) | Various libs | ⚠️ Manual | Need review |
| Major updates | React 19 → 20 | ⚠️ Manual | Breaking changes |

## Timeline Example: Security Vulnerability

Let's say a critical Next.js vulnerability is discovered (like CVE-2025-66478):

**Day 0, 00:00** - Vulnerability published, Next.js releases 15.5.7
**Day 0, 03:00** - Dependabot detects update, creates PR
**Day 0, 03:05** - GitHub Actions runs tests, build succeeds
**Day 0, 03:06** - Workflow auto-approves and auto-merges PR
**Day 0, 03:07** - Code pushed to `main` branch
**Day 0, 03:08** - Vercel detects push, starts build
**Day 0, 03:10** - Vercel deploys to production
**Day 0, 03:10** - ✅ **Your site is patched!** (all automatic, while you sleep)

## Notifications

You'll receive GitHub notifications for:
- ✉️ Dependabot PRs created
- ✉️ PR merged (auto or manual)
- ✉️ Vercel deployment status (configure in Vercel settings)

## Manual Override

You can always:
- Close a Dependabot PR if you don't want the update
- Manually review/edit a PR before it auto-merges
- Temporarily disable auto-merge by editing `.github/workflows/ci.yml`
- Rollback a deployment in Vercel dashboard

## Enabling Dependabot Alerts

Make sure Dependabot security alerts are enabled in your GitHub repository:

1. Go to your repo: https://github.com/x907/website-badscandi
2. Settings → Security & analysis
3. Enable:
   - ✅ Dependency graph
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates

## Monitoring

### Check Dependabot Status
- GitHub repo → Insights → Dependency graph → Dependabot

### Check Deployments
- Vercel dashboard: https://vercel.com/dashboard
- See all deployments, logs, and performance metrics

### Check Security Alerts
- GitHub repo → Security → Dependabot alerts
- See all vulnerabilities and their status

## Customization

### Change Auto-Merge Behavior

Edit `.github/workflows/ci.yml`:

```yaml
# To disable auto-merge entirely, comment out the auto-merge step
# To only auto-merge security updates, change the condition:
if: |
  steps.metadata.outputs.update-type == 'version-update:semver-patch' &&
  contains(steps.metadata.outputs.dependency-names, 'next')
```

### Change Dependabot Schedule

Edit `.github/dependabot.yml`:

```yaml
schedule:
  interval: "weekly"  # Change from "daily" to "weekly"
```

### Add More Checks

Edit `.github/workflows/ci.yml` to add:
- Unit tests: `npm test`
- E2E tests: `npx playwright test`
- Type checking: `npm run type-check`

## Troubleshooting

### Dependabot PRs not created
- Check if Dependabot is enabled in repo settings
- Check `.github/dependabot.yml` syntax
- Look at Insights → Dependency graph → Dependabot for errors

### Auto-merge not working
- Check GitHub Actions permissions: Settings → Actions → General → Workflow permissions
- Ensure "Allow GitHub Actions to create and approve pull requests" is checked
- Check workflow logs in Actions tab

### Vercel not deploying
- Check Vercel is connected to your GitHub repo
- Check deployment logs in Vercel dashboard
- Verify environment variables are set in Vercel

## Best Practices

1. **Monitor alerts**: Check GitHub security alerts weekly
2. **Review major updates**: Don't auto-merge major version changes
3. **Test locally**: Pull and test Dependabot PRs locally if unsure
4. **Keep Vercel env vars updated**: When adding new env vars, update Vercel settings
5. **Use preview deployments**: Vercel creates preview deployments for each PR - test them before merging

## Security Notes

- Dependabot never exposes secrets - it uses GitHub's secure environment
- Auto-merge only happens after CI tests pass
- Vercel deploys are immutable and can be rolled back instantly
- All changes are logged and auditable

## Summary

With this setup:
- 🤖 **Fully automated** security updates
- 🛡️ **Protected** by CI tests
- 🚀 **Instant** production deployments
- 🔄 **Zero downtime** deployments
- 📊 **Full visibility** into all updates
- ⏱️ **Fastest response time** to vulnerabilities (hours, not days)

You can focus on building features while the robots handle security! 🤖
