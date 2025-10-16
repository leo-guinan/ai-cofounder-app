import { Workflow } from '@mastra/core';
import { z } from 'zod';
import { GitHubFuturesClient } from '../github/client';

/**
 * Create Idea Workflow
 * 
 * Initializes a new startup idea with:
 * - GitHub repository with waterfall branches
 * - Initial README and documentation
 * - Branch protection rules
 * - Webhook configuration for stage transitions
 */

export const createIdeaWorkflow = new Workflow({
  id: 'create-idea',
  description: 'Creates a new startup idea with GitHub repository and waterfall branches',
  
  inputSchema: z.object({
    name: z.string().describe('Idea name'),
    description: z.string().describe('Idea description'),
    userId: z.string().describe('User ID'),
    githubToken: z.string().describe('GitHub token'),
    githubUser: z.string().describe('GitHub username')
  }),
  
  outputSchema: z.object({
    ideaId: z.string(),
    repoName: z.string(),
    repoUrl: z.string(),
    branches: z.array(z.string()),
    success: z.boolean()
  }),
  
  steps: [
    {
      id: 'validate-input',
      description: 'Validate idea name and description',
      action: async ({ context }: any) => {
        const { name, description } = context;
        
        // Validate name (no spaces, lowercase, etc.)
        const sanitizedName = name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 50);
        
        const repoName = `idea-${sanitizedName}`;
        
        return {
          repoName,
          validated: true,
          sanitizedName
        };
      }
    },
    
    {
      id: 'create-github-repo',
      description: 'Create GitHub repository for the idea',
      action: async ({ context, results }: any) => {
        const { githubToken, githubUser, description } = context;
        const { repoName } = results['validate-input'];
        
        const github = new GitHubFuturesClient(githubToken, githubUser);
        
        // Create repository
        const repo = await github.octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description: `AI Cofounder Idea: ${description}`,
          private: false,
          auto_init: true,
          gitignore_template: 'Node'
        });
        
        return {
          repoUrl: repo.data.html_url,
          repoName: repo.data.name,
          defaultBranch: repo.data.default_branch
        };
      }
    },
    
    {
      id: 'create-waterfall-branches',
      description: 'Create all waterfall stage branches',
      action: async ({ context, results }: any) => {
        const { githubToken, githubUser } = context;
        const { repoName, defaultBranch } = results['create-github-repo'];
        
        const github = new GitHubFuturesClient(githubToken, githubUser);
        
        // Get main branch SHA
        const mainBranch = await github.octokit.git.getRef({
          owner: githubUser,
          repo: repoName,
          ref: `heads/${defaultBranch}`
        });
        
        const sha = mainBranch.data.object.sha;
        
        // Create all waterfall branches
        const stages = [
          'requirements',
          'analysis',
          'design',
          'implementation',
          'testing',
          'validation'
        ];
        
        const createdBranches = [];
        
        for (const stage of stages) {
          await github.octokit.git.createRef({
            owner: githubUser,
            repo: repoName,
            ref: `refs/heads/${stage}`,
            sha
          });
          createdBranches.push(stage);
        }
        
        return {
          branches: createdBranches,
          baseSha: sha
        };
      }
    },
    
    {
      id: 'initialize-requirements',
      description: 'Create initial requirements documentation',
      action: async ({ context, results }: any) => {
        const { githubToken, githubUser, name, description } = context;
        const { repoName } = results['create-github-repo'];
        
        const github = new GitHubFuturesClient(githubToken, githubUser);
        
        // Create REQUIREMENTS.md
        const requirementsContent = `# Requirements Phase: ${name}

## Problem Statement
${description}

## Target Users
- [To be defined]

## Core Features
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

## Success Criteria
- [ ] Problem is clearly defined
- [ ] Target users are identified
- [ ] Core features are listed
- [ ] Assumptions are documented

## Next Steps
- Complete market research
- Validate assumptions
- Define success metrics
`;

        await github.octokit.repos.createOrUpdateFileContents({
          owner: githubUser,
          repo: repoName,
          path: 'REQUIREMENTS.md',
          message: 'feat: Initialize requirements documentation',
          content: Buffer.from(requirementsContent).toString('base64'),
          branch: 'requirements'
        });
        
        // Create ASSUMPTIONS.md
        const assumptionsContent = `# Assumptions

## Critical Assumptions
1. **Assumption**: [State assumption]
   - **Validation Method**: [How to test]
   - **Risk Level**: High/Medium/Low
   - **Status**: [ ] Not validated

## Next Steps
- [ ] Identify all critical assumptions
- [ ] Define validation methods
- [ ] Prioritize by risk
`;

        await github.octokit.repos.createOrUpdateFileContents({
          owner: githubUser,
          repo: repoName,
          path: 'ASSUMPTIONS.md',
          message: 'feat: Initialize assumptions documentation',
          content: Buffer.from(assumptionsContent).toString('base64'),
          branch: 'requirements'
        });
        
        // Create GOALS.md
        const goalsContent = `# Goals & Success Metrics

## Business Goals
1. [Goal 1]
2. [Goal 2]

## Success Metrics
- **Metric 1**: [Target]
- **Metric 2**: [Target]

## Timeline
- **Phase 1**: [Timeframe]
- **Phase 2**: [Timeframe]
`;

        await github.octokit.repos.createOrUpdateFileContents({
          owner: githubUser,
          repo: repoName,
          path: 'GOALS.md',
          message: 'feat: Initialize goals documentation',
          content: Buffer.from(goalsContent).toString('base64'),
          branch: 'requirements'
        });
        
        return {
          filesCreated: ['REQUIREMENTS.md', 'ASSUMPTIONS.md', 'GOALS.md'],
          requirementsBranch: 'requirements'
        };
      }
    },
    
    {
      id: 'setup-branch-protection',
      description: 'Configure branch protection rules',
      action: async ({ context, results }: any) => {
        const { githubToken, githubUser } = context;
        const { repoName, defaultBranch } = results['create-github-repo'];
        
        const github = new GitHubFuturesClient(githubToken, githubUser);
        
        try {
          // Protect main branch - requires PR reviews
          await github.octokit.repos.updateBranchProtection({
            owner: githubUser,
            repo: repoName,
            branch: defaultBranch,
            required_status_checks: null,
            enforce_admins: false,
            required_pull_request_reviews: {
              dismiss_stale_reviews: true,
              require_code_owner_reviews: false,
              required_approving_review_count: 1
            },
            restrictions: null
          });
          
          return {
            protectionEnabled: true,
            protectedBranch: defaultBranch
          };
        } catch (error) {
          console.log('Branch protection setup failed (may require repo admin rights):', error);
          return {
            protectionEnabled: false,
            reason: 'Insufficient permissions or GitHub plan'
          };
        }
      }
    },
    
    {
      id: 'create-idea-record',
      description: 'Store idea metadata in database',
      action: async ({ context, results }: any) => {
        const { userId, name, description } = context;
        const { repoName, repoUrl } = results['create-github-repo'];
        const { branches } = results['create-waterfall-branches'];
        
        // This would integrate with your database
        const ideaId = `idea-${Date.now()}`;
        
        return {
          ideaId,
          metadata: {
            name,
            description,
            repoName,
            repoUrl,
            branches,
            currentStage: 'requirements',
            createdAt: new Date().toISOString(),
            userId
          }
        };
      }
    }
  ] as any
});
