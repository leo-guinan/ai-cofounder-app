# GitHub Actions Deployment Setup

This project uses GitHub Actions to automatically deploy to production on every push to `main`.

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

### 1. `DEPLOY_HOST`
The IP address or hostname of your Hetzner server.

**Example:**
```
144.76.123.45
```

### 2. `DEPLOY_USER`
The SSH username (typically `root` for Hetzner).

**Example:**
```
root
```

### 3. `DEPLOY_SSH_KEY`
Your private SSH key that has access to the server.

**To get your SSH key:**
```bash
# On your local machine (or wherever you have server access)
cat ~/.ssh/id_rsa  # or id_ed25519 or whatever key you use

# Copy the ENTIRE output, including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----
```

Paste the entire private key (including BEGIN and END lines) into the secret.

### 4. `DEPLOY_PORT` (Optional)
SSH port number. Defaults to 22 if not set.

**Example:**
```
22
```

## Server Prerequisites

Your Hetzner server must have:

1. **Git repository cloned** at `/opt/ai-cofounder`
   ```bash
   cd /opt
   git clone https://github.com/leo-guinan/ai-cofounder-app.git ai-cofounder
   cd ai-cofounder
   ```

2. **Docker and Docker Compose installed**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose plugin
   apt-get update
   apt-get install docker-compose-plugin
   ```

3. **SSH access configured**
   - Your deployment SSH key must be in `~/.ssh/authorized_keys` on the server
   - Test it: `ssh -i ~/.ssh/your_key root@your-server-ip`

4. **Environment variables configured**
   - Create `.env.production` in `/opt/ai-cofounder` with required secrets
   - See `.env.production.template` for required variables

## How It Works

### Automatic Deployment

When you push to `main`:

1. ✅ GitHub Actions checks out the code
2. 🔐 SSHs into your Hetzner server
3. 📥 Pulls latest changes from `main` branch
4. 🔨 Rebuilds Docker images with `--no-cache`
5. ♻️ Restarts all services with new code
6. 🧹 Cleans up old Docker images
7. 📊 Shows deployment status

### Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Choose `main` branch
5. Click **Run workflow**

## Testing the Setup

After configuring secrets:

1. **Make a small change** (e.g., update README.md)
2. **Push to main:**
   ```bash
   git add .
   git commit -m "test: trigger deployment"
   git push origin main
   ```
3. **Watch the deployment:**
   - Go to GitHub → Actions tab
   - Click on your commit
   - Watch the "Deploy to Hetzner" job run

## Troubleshooting

### "Host key verification failed"

Add your server's host key to GitHub's known hosts. On your server:
```bash
ssh-keyscan -H your-server-ip
```

Or add to the workflow:
```yaml
script_stop: false
script: |
  set -e
  ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts
```

### "Permission denied (publickey)"

1. Check that `DEPLOY_SSH_KEY` contains the PRIVATE key (not public)
2. Verify the key is in `~/.ssh/authorized_keys` on the server
3. Test SSH access manually first

### "git pull" fails

The server might have local changes. On the server:
```bash
cd /opt/ai-cofounder
git status
git reset --hard origin/main  # WARNING: Loses local changes!
```

### Docker build fails

Check the logs:
```bash
ssh root@your-server
cd /opt/ai-cofounder
docker compose -f docker-compose.prod.yml logs
```

## Security Best Practices

1. **Use a dedicated deployment key** - don't reuse your personal SSH key
2. **Limit key scope** - use GitHub Deploy Keys when possible
3. **Rotate keys regularly** - especially if compromised
4. **Monitor deployments** - check Actions logs for suspicious activity
5. **Use environment secrets** - never commit production credentials

## Rollback Procedure

If a deployment breaks production:

1. **SSH into server:**
   ```bash
   ssh root@your-server-ip
   cd /opt/ai-cofounder
   ```

2. **Revert to previous commit:**
   ```bash
   git log --oneline  # Find the last working commit
   git reset --hard <commit-hash>
   ```

3. **Rebuild and restart:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **OR manually trigger workflow** for a known-good commit

## Future Enhancements

Potential improvements to the deployment pipeline:

- [ ] Add health checks before marking deployment as successful
- [ ] Implement blue-green deployment strategy
- [ ] Add Slack/Discord notifications on deployment
- [ ] Run smoke tests after deployment
- [ ] Implement automatic rollback on failure
- [ ] Add deployment approval gates for production
- [ ] Track deployment metrics and duration

---

**Last updated:** 2025-10-15

