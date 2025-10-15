#!/bin/bash
# AI Cofounder Production Deployment Script
# Generated: 2025-10-15T12:52:46.130362

set -e

echo "================================"
echo "AI Cofounder Production Deployment"
echo "================================"
echo ""

# Check if running on server
if [ "$(hostname)" != "178.156.207.21" ]; then
  echo "⚠️  This should run on the production server"
  echo "   SSH to server first: ssh root@178.156.207.21"
  exit 1
fi

# Install AI Cofounder CLI
if ! command -v cofounder &> /dev/null; then
  echo "Installing AI Cofounder CLI..."
  ./scripts/install-cli.sh
fi

# Initialize node
echo ""
echo "Initializing AI Cofounder node..."
cofounder init -c https://central.aicofounder.com -t YOUR_TOKEN_HERE

# Set up SSL
echo ""
echo "Setting up SSL for myaicofounder.com..."
cofounder ssl setup -d myaicofounder.com -e leo@ideanexusventures.com


# Deploy application
echo ""
echo "Deploying application..."
cofounder deploy

# Start agent
echo ""
echo "Starting monitoring agent..."
cofounder agent start --daemon

echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "Access your AI Cofounder at: https://myaicofounder.com"
echo "Admin email: leo@ideanexusventures.com"
echo ""
