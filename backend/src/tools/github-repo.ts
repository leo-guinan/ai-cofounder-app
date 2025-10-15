/**
 * GitHub Repository Management Tool
 * 
 * Allows AI Cofounder to create and manage GitHub repositories for user ideas.
 * This implements the "idea → repo" workflow for GitHub-based Possible Futures.
 */

import { Tool } from '@mastra/core';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * GitHub Repository Tool
 * 
 * Capabilities:
 * 1. Create new repository for an idea
 * 2. Initialize with README and basic structure
 * 3. Set up branches for waterfall stages
 * 4. Configure repository settings
 */
export const createGitHubRepoTool = (octokit: Octokit, workspaceDir: string) => {
  return new Tool({
    id: 'create-github-repo',
    description: `
      Create a new GitHub repository for an idea.
      
      This sets up the foundation for the GitHub-based Possible Futures workflow:
      - Creates repository with description
      - Initializes with README
      - Sets up waterfall branches (requirements, design, development, testing, deployment)
      - Configures branch protection
      - Returns repository URL and metadata
      
      Use this when user wants to start working on a new idea.
    `,
    inputSchema: z.object({
      name: z.string().describe('Repository name (lowercase, hyphens, no spaces)'),
      description: z.string().describe('What this idea/project is about'),
      isPrivate: z.boolean().default(false).describe('Whether repository should be private'),
      topics: z.array(z.string()).optional().describe('GitHub topics/tags for the repo'),
      initializeWaterfall: z.boolean().default(true).describe('Set up waterfall stage branches'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      repoUrl: z.string().optional(),
      repoName: z.string().optional(),
      owner: z.string().optional(),
      branches: z.array(z.string()).optional(),
      error: z.string().optional(),
    }),
    execute: async ({ context }) => {
      const { name, description, isPrivate, topics, initializeWaterfall } = context;
      
      try {
        // Get authenticated user
        const { data: user } = await octokit.users.getAuthenticated();
        
        console.log(`Creating repository: ${name} for ${user.login}`);
        
        // Create repository
        const { data: repo } = await octokit.repos.createForAuthenticatedUser({
          name,
          description,
          private: isPrivate,
          auto_init: true, // Initialize with README
          has_issues: true,
          has_projects: true,
          has_wiki: false,
        });
        
        console.log(`✓ Repository created: ${repo.html_url}`);
        
        // Add topics if provided
        if (topics && topics.length > 0) {
          await octokit.repos.replaceAllTopics({
            owner: user.login,
            repo: name,
            names: topics,
          });
          console.log(`✓ Topics added: ${topics.join(', ')}`);
        }
        
        // Set up waterfall branches if requested
        const branches: string[] = ['main'];
        
        if (initializeWaterfall) {
          const waterfallStages = [
            'requirements',
            'design',
            'development',
            'testing',
            'deployment',
          ];
          
          // Get default branch SHA
          const { data: mainBranch } = await octokit.repos.getBranch({
            owner: user.login,
            repo: name,
            branch: 'main',
          });
          
          const baseSha = mainBranch.commit.sha;
          
          // Create waterfall stage branches
          for (const stage of waterfallStages) {
            try {
              await octokit.git.createRef({
                owner: user.login,
                repo: name,
                ref: `refs/heads/${stage}`,
                sha: baseSha,
              });
              branches.push(stage);
              console.log(`✓ Created branch: ${stage}`);
            } catch (error: any) {
              if (error.status !== 422) { // Ignore if branch already exists
                console.error(`Failed to create branch ${stage}:`, error.message);
              }
            }
          }
          
          // Create initial commit to requirements branch with structure
          const readmeContent = `# ${name}

${description}

## Idea Status

**Stage**: Requirements
**Created**: ${new Date().toISOString()}

## Waterfall Progression

This repository follows the AI Cofounder waterfall workflow:

- \`requirements\` - Requirements gathering and validation
- \`design\` - System design and architecture
- \`development\` - Implementation
- \`testing\` - Testing and quality assurance
- \`deployment\` - Production deployment

Each stage is a branch. Decisions are commits. Progress via pull requests.

## Next Steps

1. Define requirements (in \`requirements\` branch)
2. AI validates requirements against goals
3. Progress to design stage
4. Continue through waterfall
5. Deploy to production

---

*Generated by AI Cofounder*
`;
          
          try {
            await octokit.repos.createOrUpdateFileContents({
              owner: user.login,
              repo: name,
              path: 'README.md',
              message: 'Initialize requirements stage',
              content: Buffer.from(readmeContent).toString('base64'),
              branch: 'requirements',
            });
            console.log(`✓ Initialized README on requirements branch`);
          } catch (error: any) {
            console.error('Failed to update README:', error.message);
          }
        }
        
        return {
          success: true,
          repoUrl: repo.html_url,
          repoName: name,
          owner: user.login,
          branches,
        };
        
      } catch (error: any) {
        console.error('Failed to create repository:', error);
        
        return {
          success: false,
          error: error.message || 'Failed to create repository',
        };
      }
    },
  });
};

/**
 * Clone Repository Tool
 * 
 * Clone a repository to local workspace for manipulation
 */
export const cloneGitHubRepoTool = (workspaceDir: string) => {
  return new Tool({
    id: 'clone-github-repo',
    description: 'Clone a GitHub repository to local workspace',
    inputSchema: z.object({
      repoUrl: z.string().describe('GitHub repository URL'),
      localPath: z.string().optional().describe('Local path to clone to (relative to workspace)'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      localPath: z.string().optional(),
      error: z.string().optional(),
    }),
    execute: async ({ context }) => {
      const { repoUrl, localPath } = context;
      
      try {
        const git: SimpleGit = simpleGit();
        
        // Determine clone path
        const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
        const clonePath = path.join(workspaceDir, localPath || repoName);
        
        console.log(`Cloning ${repoUrl} to ${clonePath}`);
        
        // Check if directory exists
        try {
          await fs.access(clonePath);
          return {
            success: false,
            error: `Directory already exists: ${clonePath}`,
          };
        } catch {
          // Directory doesn't exist, good to clone
        }
        
        // Clone repository
        await git.clone(repoUrl, clonePath);
        
        console.log(`✓ Cloned to ${clonePath}`);
        
        return {
          success: true,
          localPath: clonePath,
        };
        
      } catch (error: any) {
        console.error('Failed to clone repository:', error);
        
        return {
          success: false,
          error: error.message || 'Failed to clone repository',
        };
      }
    },
  });
};

/**
 * Create Branch Tool
 * 
 * Create a new branch in a repository (for waterfall progression)
 */
export const createBranchTool = (octokit: Octokit) => {
  return new Tool({
    id: 'create-branch',
    description: 'Create a new branch in a GitHub repository',
    inputSchema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      branchName: z.string().describe('New branch name'),
      fromBranch: z.string().default('main').describe('Base branch to create from'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      branchName: z.string().optional(),
      error: z.string().optional(),
    }),
    execute: async ({ context }) => {
      const { owner, repo, branchName, fromBranch } = context;
      
      try {
        // Get base branch SHA
        const { data: baseBranch } = await octokit.repos.getBranch({
          owner,
          repo,
          branch: fromBranch,
        });
        
        // Create new branch
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha: baseBranch.commit.sha,
        });
        
        console.log(`✓ Created branch: ${branchName} from ${fromBranch}`);
        
        return {
          success: true,
          branchName,
        };
        
      } catch (error: any) {
        console.error('Failed to create branch:', error);
        
        return {
          success: false,
          error: error.message || 'Failed to create branch',
        };
      }
    },
  });
};

/**
 * Create Pull Request Tool
 * 
 * Create a pull request to progress between waterfall stages
 */
export const createPullRequestTool = (octokit: Octokit) => {
  return new Tool({
    id: 'create-pull-request',
    description: 'Create a pull request to merge changes between branches',
    inputSchema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      title: z.string().describe('Pull request title'),
      body: z.string().describe('Pull request description'),
      head: z.string().describe('Branch with changes'),
      base: z.string().describe('Branch to merge into'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      prUrl: z.string().optional(),
      prNumber: z.number().optional(),
      error: z.string().optional(),
    }),
    execute: async ({ context }) => {
      const { owner, repo, title, body, head, base } = context;
      
      try {
        const { data: pr } = await octokit.pulls.create({
          owner,
          repo,
          title,
          body,
          head,
          base,
        });
        
        console.log(`✓ Created PR #${pr.number}: ${pr.html_url}`);
        
        return {
          success: true,
          prUrl: pr.html_url,
          prNumber: pr.number,
        };
        
      } catch (error: any) {
        console.error('Failed to create pull request:', error);
        
        return {
          success: false,
          error: error.message || 'Failed to create pull request',
        };
      }
    },
  });
};

/**
 * Export all GitHub repository tools
 */
export const githubRepoTools = (octokit: Octokit, workspaceDir: string) => {
  return [
    createGitHubRepoTool(octokit, workspaceDir),
    cloneGitHubRepoTool(workspaceDir),
    createBranchTool(octokit),
    createPullRequestTool(octokit),
  ];
};

