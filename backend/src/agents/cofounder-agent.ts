import { Agent } from '@mastra/core';
import { GitHubFuturesClient } from '../github/client';

/**
 * Cofounder Agent
 * 
 * Primary AI agent that:
 * - Spawns ideas as GitHub repositories
 * - Makes decisions (commits)
 * - Generates content for next stages
 * - Reviews PRs for stage transitions
 */

export const coffounderAgent = new Agent({
  name: 'cofounder',
  instructions: 'Primary AI Cofounder agent that helps explore ideas through GitHub-based Possible Futures',
  model: {
    provider: 'openai',
    toolChoice: 'auto'
  } as any,
  
  tools: [
    {
      description: 'Create a new idea as a GitHub repository',
      parameters: {
        name: { type: 'string', description: 'Idea name' },
        description: { type: 'string', description: 'Idea description' }
      },
      execute: async ({ name, description }: any, options?: any) => {
        const context = options?.context || {};
        const github = new GitHubFuturesClient(
          context.githubToken,
          context.githubUser
        );
        
        const repoName = await github.createIdea(name, description);
        return { repoName, url: `https://github.com/${context.githubUser}/${repoName}` };
      }
    },
    
    {
      description: 'Make a decision (creates commit in idea repo)',
      parameters: {
        repoName: { type: 'string', description: 'Idea repository name' },
        branch: { type: 'string', description: 'Branch (stage) to commit to' },
        decision: {
          type: 'object',
          description: 'Decision details',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            alternatives: { type: 'array' },
            chosen: { type: 'string' },
            reason: { type: 'string' },
            confidence: { type: 'number' },
            revisitProbability: { type: 'number' }
          }
        }
      },
      execute: async ({ repoName, branch, decision }: any, options?: any) => {
        const context = options?.context || {};
        const github = new GitHubFuturesClient(
          context.githubToken,
          context.githubUser
        );
        
        const result = await github.makeDecision(repoName, branch, decision);
        return result;
      }
    },
    
    {
      description: 'Check if a decision was already made',
      parameters: {
        repoName: { type: 'string' },
        decisionName: { type: 'string' }
      },
      execute: async ({ repoName, decisionName }: any, options?: any) => {
        const context = options?.context || {};
        const github = new GitHubFuturesClient(
          context.githubToken,
          context.githubUser
        );
        
        const existing = await github.findDecision(repoName, decisionName);
        
        if (existing) {
          return {
            alreadyDecided: true,
            decision: existing,
            message: `Decision "${decisionName}" already made: ${existing.chosen}`
          };
        }
        
        return {
          alreadyDecided: false,
          message: 'No previous decision found'
        };
      }
    },
    
    {
      description: 'List all idea repositories for the user',
      parameters: {},
      execute: async (_params: any, options?: any) => {
        const context = options?.context || {};
        const github = new GitHubFuturesClient(
          context.githubToken,
          context.githubUser
        );
        
        const repos = await (github as any).octokit.repos.listForAuthenticatedUser({
          type: 'owner',
          sort: 'updated',
          per_page: 100
        });
        
        // Filter for idea repositories
        const ideas = repos.data.filter((r: any) => r.name.startsWith('idea-'));
        
        return {
          ideas: ideas.map((r: any) => ({
            name: r.name,
            description: r.description,
            url: r.html_url,
            updated: r.updated_at
          }))
        };
      }
    }
  ] as any
});
