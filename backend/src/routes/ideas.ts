import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createIdeaWorkflow } from '../workflows/create-idea-workflow.js';
import { requirementsWorkflow } from '../workflows/requirements-workflow.js';
import { analysisWorkflow } from '../workflows/analysis-workflow.js';

/**
 * Ideas API Routes
 * 
 * Endpoints for managing startup ideas and executing Mastra workflows
 */

interface CreateIdeaBody {
  name: string;
  description: string;
}

interface ExecuteWorkflowBody {
  stage: 'requirements' | 'analysis' | 'design' | 'implementation' | 'testing' | 'validation';
}

interface AuthRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    githubToken?: string;
    githubUser?: string;
  };
}

export async function ideasRoutes(fastify: FastifyInstance) {
  
  /**
   * POST /api/ideas
   * Create a new startup idea and initialize GitHub repository
   */
  fastify.post('/ideas', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { name, description } = request.body as CreateIdeaBody;
      
      // Validate input
      if (!name || name.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Idea name is required'
        });
      }
      
      if (!description || description.trim().length < 10) {
        return reply.status(400).send({
          success: false,
          error: 'Description must be at least 10 characters'
        });
      }
      
      // Get user context (would come from auth middleware)
      const userId = request.user?.id || 'demo-user';
      const githubToken = request.user?.githubToken || process.env.GITHUB_TOKEN || '';
      const githubUser = request.user?.githubUser || process.env.GITHUB_USER || '';
      
      if (!githubToken || !githubUser) {
        return reply.status(400).send({
          success: false,
          error: 'GitHub credentials not configured. Please connect your GitHub account.'
        });
      }
      
      fastify.log.info(`Creating idea: ${name} for user: ${userId}`);
      
      // Execute Create Idea Workflow
      const workflowResult = await createIdeaWorkflow.execute({
        name: name.trim(),
        description: description.trim(),
        userId,
        githubToken,
        githubUser
      });
      
      if (!workflowResult.success) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to create idea',
          details: workflowResult.error
        });
      }
      
      // Store in database (simplified for now)
      const idea = {
        id: workflowResult.ideaId,
        userId,
        name: name.trim(),
        description: description.trim(),
        repoName: workflowResult.repoName,
        repoUrl: workflowResult.repoUrl,
        currentStage: 'requirements',
        branches: workflowResult.branches,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // TODO: Save to actual database
      // await db.insert(ideas).values(idea);
      
      fastify.log.info(`Idea created successfully: ${workflowResult.ideaId}`);
      
      return reply.status(201).send({
        success: true,
        idea,
        message: 'Idea created successfully! GitHub repository initialized with waterfall branches.'
      });
      
    } catch (error: any) {
      fastify.log.error('Error creating idea:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create idea',
        details: error.message
      });
    }
  });
  
  /**
   * GET /api/ideas
   * List all ideas for the authenticated user
   */
  fastify.get('/ideas', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id || 'demo-user';
      
      // TODO: Fetch from actual database
      // const userIdeas = await db.select().from(ideas).where(eq(ideas.userId, userId));
      
      // Mock data for now
      const userIdeas = [
        {
          id: 'idea-1',
          name: 'AI Scheduling App',
          description: 'Help small businesses schedule appointments intelligently',
          repoName: 'idea-ai-scheduling-app',
          repoUrl: 'https://github.com/user/idea-ai-scheduling-app',
          currentStage: 'requirements',
          branches: ['requirements', 'analysis', 'design', 'implementation', 'testing', 'validation'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return {
        success: true,
        ideas: userIdeas,
        count: userIdeas.length
      };
      
    } catch (error: any) {
      fastify.log.error('Error fetching ideas:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch ideas',
        details: error.message
      });
    }
  });
  
  /**
   * GET /api/ideas/:id
   * Get details of a specific idea
   */
  fastify.get('/ideas/:id', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user?.id || 'demo-user';
      
      // TODO: Fetch from actual database
      // const idea = await db.select().from(ideas).where(eq(ideas.id, id)).limit(1);
      
      // Mock data for now
      const idea = {
        id,
        userId,
        name: 'AI Scheduling App',
        description: 'Help small businesses schedule appointments intelligently',
        repoName: 'idea-ai-scheduling-app',
        repoUrl: 'https://github.com/user/idea-ai-scheduling-app',
        currentStage: 'requirements',
        branches: ['requirements', 'analysis', 'design', 'implementation', 'testing', 'validation'],
        progress: [
          { stage: 'requirements', completed: false, startedAt: new Date().toISOString() }
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        idea
      };
      
    } catch (error: any) {
      fastify.log.error('Error fetching idea:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch idea',
        details: error.message
      });
    }
  });
  
  /**
   * POST /api/ideas/:id/execute-workflow
   * Execute a specific workflow stage for an idea
   */
  fastify.post('/ideas/:id/execute-workflow', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { stage } = request.body as ExecuteWorkflowBody;
      const userId = request.user?.id || 'demo-user';
      
      // TODO: Fetch idea from database
      // const idea = await db.select().from(ideas).where(eq(ideas.id, id)).limit(1);
      
      const githubToken = request.user?.githubToken || process.env.GITHUB_TOKEN || '';
      const githubUser = request.user?.githubUser || process.env.GITHUB_USER || '';
      
      // Mock idea data
      const idea = {
        id,
        repoName: 'idea-ai-scheduling-app',
        description: 'Help small businesses schedule appointments intelligently',
        currentStage: 'requirements'
      };
      
      fastify.log.info(`Executing ${stage} workflow for idea: ${id}`);
      
      // Execute appropriate workflow based on stage
      let workflowResult;
      
      switch (stage) {
        case 'requirements':
          workflowResult = await requirementsWorkflow.execute({
            repoName: idea.repoName,
            githubToken,
            githubUser,
            ideaDescription: idea.description,
            founderContext: { userId }
          });
          break;
          
        case 'analysis':
          workflowResult = await analysisWorkflow.execute({
            repoName: idea.repoName,
            githubToken,
            githubUser,
            requirementsContext: { /* would load from requirements branch */ }
          });
          break;
          
        default:
          return reply.status(400).send({
            success: false,
            error: `Workflow for stage "${stage}" not yet implemented`
          });
      }
      
      // Update idea stage in database if workflow completed
      if (workflowResult.complete && workflowResult.readyForNextStage) {
        // TODO: Update database
        // await db.update(ideas).set({ currentStage: getNextStage(stage) }).where(eq(ideas.id, id));
      }
      
      return {
        success: true,
        stage,
        workflow: {
          complete: workflowResult.complete,
          deliverables: workflowResult.deliverables,
          readyForNextStage: workflowResult.readyForNextStage
        },
        message: workflowResult.complete 
          ? `${stage} phase completed successfully!`
          : `${stage} phase incomplete. Please review deliverables.`
      };
      
    } catch (error: any) {
      fastify.log.error('Error executing workflow:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to execute workflow',
        details: error.message
      });
    }
  });
  
  /**
   * GET /api/ideas/:id/status
   * Get current status of an idea (branch status, completion, etc.)
   */
  fastify.get('/ideas/:id/status', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      // TODO: Get actual status from GitHub and database
      
      return {
        success: true,
        status: {
          currentStage: 'requirements',
          branches: {
            requirements: { complete: false, filesCount: 3, lastCommit: new Date().toISOString() },
            analysis: { complete: false, filesCount: 0 },
            design: { complete: false, filesCount: 0 },
            implementation: { complete: false, filesCount: 0 },
            testing: { complete: false, filesCount: 0 },
            validation: { complete: false, filesCount: 0 }
          },
          overallProgress: 5 // percentage
        }
      };
      
    } catch (error: any) {
      fastify.log.error('Error fetching idea status:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch idea status',
        details: error.message
      });
    }
  });
}
