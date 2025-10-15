# Deployment Quick Start

This guide gets you from "code pushed" to "live in production" in minutes.

## Current Status

✅ **Docker build fixed** - All services use pnpm with frozen lockfiles  
✅ **GitHub Actions configured** - Auto-deploy on push to main  
✅ **Frontend config fixed** - tsconfig.node.json added  
⚠️ **Needs setup** - GitHub Secrets for deployment  

## Next Steps (You Need To Do This)

### 1. Configure GitHub Secrets

Go to: https://github.com/leo-guinan/ai-cofounder-app/settings/secrets/actions

Click **"New repository secret"** for each:

| Secret Name | Value | How to Get It |
|------------|-------|---------------|
| `DEPLOY_HOST` | Your Hetzner server IP | From Hetzner dashboard or your notes |
| `DEPLOY_USER` | `root` | Standard for Hetzner |
| `DEPLOY_SSH_KEY` | Your private SSH key | `cat ~/.ssh/id_rsa` (or id_ed25519) |
| `DEPLOY_PORT` | `22` | Default SSH port (optional) |

**Important:** For `DEPLOY_SSH_KEY`, copy the ENTIRE private key including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
... all the key content ...
-----END OPENSSH PRIVATE KEY-----
```

### 2. Test the Deployment

Once secrets are configured:

```bash
# Make any small change
cd /Users/leoguinan/cofounderchat/ai-cofounder-app
echo "# Deployment test" >> README.md
git add README.md
git commit -m "test: trigger deployment"
git push origin main
```

Then watch it deploy:
- Go to: https://github.com/leo-guinan/ai-cofounder-app/actions
- Click on your commit
- Watch the "Deploy to Hetzner" job

### 3. Verify It's Live

After deployment succeeds:

```bash
# SSH into your server
ssh root@your-server-ip

# Check containers are running
cd /opt/ai-cofounder
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs --tail=50
```

## What Happens on Each Push to Main

1. GitHub Actions triggers automatically
2. Connects to your Hetzner server via SSH
3. Pulls latest code from `main`
4. Rebuilds Docker images (with proper pnpm lockfiles)
5. Restarts all services
6. Cleans up old images
7. Shows deployment status

**Time:** ~2-3 minutes from push to live

## Manual Deployment

Don't want to push to trigger deploy? Use manual trigger:

1. Go to: https://github.com/leo-guinan/ai-cofounder-app/actions
2. Click "Deploy to Production"
3. Click "Run workflow"
4. Select `main` branch
5. Click "Run workflow"

## Troubleshooting

### First deployment fails?

Check on server:
```bash
ssh root@your-server-ip
cd /opt
ls -la ai-cofounder  # Does it exist?
```

If not, clone it:
```bash
cd /opt
git clone https://github.com/leo-guinan/ai-cofounder-app.git ai-cofounder
cd ai-cofounder
```

### "Host key verification failed"?

GitHub doesn't recognize your server. Two options:

**Option 1:** Add `StrictHostKeyChecking=no` to workflow (less secure):
```yaml
with:
  host: ${{ secrets.DEPLOY_HOST }}
  username: ${{ secrets.DEPLOY_USER }}
  key: ${{ secrets.DEPLOY_SSH_KEY }}
  script_stop: false
  envs: StrictHostKeyChecking=no
```

**Option 2:** Add host key to GitHub known_hosts (more secure - see DEPLOYMENT_SETUP.md)

### Docker build still fails?

The fixes are in the latest code. On server:
```bash
cd /opt/ai-cofounder
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

## Files Modified

This deployment setup added/modified:

- ✅ `frontend/tsconfig.node.json` - Vite tooling config
- ✅ `frontend/.dockerignore` - Updated to include tsconfig files
- ✅ `.github/workflows/deploy-production.yml` - Deployment automation
- ✅ `.github/DEPLOYMENT_SETUP.md` - Detailed setup guide
- ✅ `DEPLOYMENT_QUICKSTART.md` - This file

## Security Notes

- Never commit the private SSH key to git
- Rotate deployment keys regularly
- Use GitHub's encrypted secrets (they're masked in logs)
- Monitor the Actions tab for unexpected deployments

## That's It!

Once you configure the 3 GitHub secrets, every push to `main` automatically deploys to production.

**Move fast. Ship often. Break nothing.**

---

Need help? See `.github/DEPLOYMENT_SETUP.md` for detailed troubleshooting.

