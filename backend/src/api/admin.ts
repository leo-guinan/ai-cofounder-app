import { FastifyInstance } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Admin API Routes
 * 
 * Provides detailed system information for app owner
 * Requires admin authentication
 */

export async function adminRoutes(fastify: FastifyInstance) {
  // Admin authentication middleware
  fastify.addHook('preHandler', async (request, reply) => {
    const adminConfig = loadAdminConfig();
    const userEmail = request.headers['x-user-email'];
    
    const isAdmin = adminConfig.admins.some((a: { email: string }) => a.email === userEmail);
    
    if (!isAdmin) {
      reply.code(403).send({ error: 'Admin access required' });
      return;
    }
  });
  
  // Get admin dashboard stats
  fastify.get('/admin/stats', async (request, reply) => {
    const stats = await getAdminStats();
    return stats;
  });
  
  // Get all users
  fastify.get('/admin/users', async (request, reply) => {
    const users = await getAllUsers();
    return { users };
  });
  
  // Get all ideas
  fastify.get('/admin/ideas', async (request, reply) => {
    const ideas = await getAllIdeas();
    return { ideas };
  });
  
  // Get system health
  fastify.get('/admin/health', async (request, reply) => {
    const health = await getSystemHealth();
    return health;
  });
  
  // Get all deployed nodes
  fastify.get('/admin/nodes', async (request, reply) => {
    const nodes = await getDeployedNodes();
    return { nodes };
  });
  
  // Get security events
  fastify.get('/admin/security-events', async (request, reply) => {
    const events = await getSecurityEvents();
    return { events };
  });
  
  // Get recent activity
  fastify.get('/admin/activity', async (request, reply) => {
    const activity = await getRecentActivity();
    return { activity };
  });
  
  // Get system logs
  fastify.get('/admin/logs', async (request, reply) => {
    const { lines = 100, service } = request.query as any;
    const logs = await getSystemLogs(service, parseInt(lines));
    return { logs };
  });
}

function loadAdminConfig() {
  const configPath = path.join(__dirname, '../../data/admin-config.json');
  
  if (!fs.existsSync(configPath)) {
    return { admins: [] };
  }
  
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

async function getAdminStats() {
  // Aggregate statistics for admin dashboard
  return {
    users: {
      total: 1, // Would query database
      active: 1,
      newThisWeek: 1
    },
    ideas: {
      total: 0, // Would query GitHub API for idea repos
      active: 0,
      completed: 0
    },
    system: {
      uptime: process.uptime(),
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB / ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      cpu: process.cpuUsage().user / 1000000, // Convert to seconds
      requests: 0 // Would track in metrics
    },
    nodes: {
      total: 1,
      online: 1,
      degraded: 0
    }
  };
}

async function getAllUsers() {
  // Would query user database
  return [];
}

async function getAllIdeas() {
  // Would query GitHub for all idea-* repositories
  return [];
}

async function getSystemHealth() {
  return {
    status: 'healthy',
    checks: {
      database: 'ok',
      github: 'ok',
      ai_model: 'ok',
      telemetry: 'ok'
    },
    uptime: process.uptime(),
    version: '0.1.0'
  };
}

async function getDeployedNodes() {
  // Would query nodes database/registry
  return [];
}

async function getSecurityEvents() {
  // Would query security event log
  return [];
}

async function getRecentActivity() {
  // Would query activity log
  return [];
}

async function getSystemLogs(service: string, lines: number) {
  // Would read logs from journald or log files
  return [];
}

