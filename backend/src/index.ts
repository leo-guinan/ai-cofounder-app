import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';

const fastify = Fastify({ logger: true });

// Plugins
await fastify.register(cors);
await fastify.register(websocket);

// Routes
fastify.get('/', async () => ({ 
  message: 'AI Cofounder Backend API',
  version: '0.1.0',
  status: 'running',
  endpoints: {
    health: '/health',
    admin: '/admin/*'
  }
}));

fastify.get('/health', async () => ({ status: 'ok' }));

// Admin routes
fastify.register(import('./api/admin'), { prefix: '/admin' });

// Telemetry endpoint
fastify.post('/telemetry/report', async (request, reply) => {
  const metrics = request.body;
  console.log('Received telemetry:', metrics);
  return { received: true };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 AI Cofounder Backend running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
