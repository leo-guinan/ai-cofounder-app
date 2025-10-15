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
  description: 'Primary AI Cofounder agent',
  
  model: {
    provider: 'openai',
    name: 'gpt-4',
    temperature: 0.7
  },
  
  tools: [
    {
      name: 'create_idea_repo',
      description: 'Create a new idea as a GitHub repository',
      parameters: {
        name: { type: 'string', description: 'Idea name' },
        description: { type: 'string', description: 'Idea description' }
      },
      execute: async ({ name, description }, { context }) => {
        const github = new GitHubFuturesClient(
          context.githubToken,
          context.githubUser
        );
        
        const repoName = await github.createIdea(name, description);
        return { repoName, url: `https://github.com/${context.githubUser}/${repoName}` };
      }
    },
    
    {
      name: 'make_decision',
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
      execute: async ({ repoName, branch, decision }, { context }) => {
        const github = new GitHubFuturesClient(
          context.githubToken,
          context.githubUser
        );
        
        const result = await github.makeDecision(repoName, branch, decision);
        return result;
      }
    },
    
    {
      name: 'check_decision_history',
      description: 'Check if a decision was already made',
      parameters: {
        repoName: { type: 'string' },
        decisionName: { type: 'string' }
      },
      execute: async ({ repoName, decisionName }, { context }) => {
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
      name: 'list_user_ideas',
      description: 'List all idea repositories for the user',
      parameters: {},
      execute: async ({}, { context }) => {
        const github = new GitHubFuturesClient(
          context.githubToken,
          context.githubUser
        );
        
        const repos = await github.octokit.repos.listForAuthenticatedUser({
          type: 'owner',
          sort: 'updated',
          per_page: 100
        });
        
        // Filter for idea repositories
        const ideas = repos.data.filter(r => r.name.startsWith('idea-'));
        
        return {
          ideas: ideas.map(r => ({
            name: r.name,
            description: r.description,
            url: r.html_url,
            updated: r.updated_at
          }))
        };
      }
    }
  ],
  
  systemPrompt: `You are an AI Cofounder using GitHub-based Possible Futures methodology.

Key principles:
- Each idea = GitHub repository
- Each waterfall stage = branch
- Each decision = commit (immutable)
- Never make the same decision twice (check git history first)
- Decisions come to founder exactly once
- Only revisit if revisitProbability > 0.7 AND goal is blocked

When user wants to explore an idea:
1. Check if similar idea exists (list_user_ideas)
2. Create new repository (create_idea_repo)
3. Make decisions as needed (make_decision)
4. Always check history first (check_decision_history)
5. Progress through waterfall automatically (Mastra workflows handle it)

Remember: Git commits are immutable. Decisions are permanent unless explicitly reversed.`
});
