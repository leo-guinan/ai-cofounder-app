import { Workflow } from '@mastra/core';
import { GitHubFuturesClient } from '../github/client';

/**
 * Waterfall Progression Workflow
 * 
 * Automatically progresses ideas through waterfall stages:
 * requirements → analysis → design → implementation → testing → validation → deployment
 * 
 * Triggered when any waterfall branch is updated
 */

export const waterfallProgression = new Workflow({
  name: 'waterfall-progression',
  description: 'Automatically progress ideas through waterfall stages',
  
  trigger: {
    type: 'github_push',
    branches: [
      'requirements',
      'analysis',
      'design',
      'implementation',
      'testing',
      'validation'
    ]
  },
  
  steps: [
    {
      id: 'detect-stage',
      name: 'Detect Current Stage',
      action: async ({ context }) => {
        const branch = context.ref.replace('refs/heads/', '');
        const stage = branch.split('/')[0]; // Handle implementation/develop
        
        return {
          currentStage: stage,
          nextStage: getNextStage(stage),
          branch
        };
      }
    },
    
    {
      id: 'load-content',
      name: 'Load Stage Content',
      action: async ({ context, results }) => {
        const { currentStage, branch } = results['detect-stage'];
        
        const github = new GitHubFuturesClient(
          context.githubToken,
          context.repo.owner
        );
        
        // Load all markdown files from current branch
        const content = await github.loadAllFiles(
          context.repo.name,
          branch
        );
        
        return { content };
      }
    },
    
    {
      id: 'check-completeness',
      name: 'Check Stage Completeness',
      action: async ({ results }) => {
        const { currentStage } = results['detect-stage'];
        const { content } = results['load-content'];
        
        // Stage-specific completion checks
        switch (currentStage) {
          case 'requirements':
            return checkRequirementsComplete(content);
          case 'analysis':
            return checkAnalysisComplete(content);
          case 'design':
            return checkDesignComplete(content);
          case 'implementation':
            return checkImplementationComplete(content);
          case 'testing':
            return checkTestingComplete(content);
          case 'validation':
            return checkValidationComplete(content);
          default:
            return { complete: false, reason: 'Unknown stage' };
        }
      }
    },
    
    {
      id: 'generate-next-stage',
      name: 'Generate Next Stage Content',
      condition: ({ results }) => results['check-completeness'].complete,
      action: async ({ results, agents }) => {
        const { currentStage, nextStage } = results['detect-stage'];
        const { content } = results['load-content'];
        
        // Use AI agent to generate next stage
        const generated = await agents.cofounder.generateStageContent(
          currentStage,
          nextStage,
          content
        );
        
        return { generated };
      }
    },
    
    {
      id: 'commit-to-next-stage',
      name: 'Commit Generated Content',
      condition: ({ results }) => results['generate-next-stage'],
      action: async ({ context, results }) => {
        const { nextStage } = results['detect-stage'];
        const { generated } = results['generate-next-stage'];
        
        const github = new GitHubFuturesClient(
          context.githubToken,
          context.repo.owner
        );
        
        // Commit all generated files to next stage branch
        await github.commitFiles(
          context.repo.name,
          nextStage,
          generated.files,
          `generate: ${nextStage} from previous stage`
        );
        
        return { committed: true };
      }
    },
    
    {
      id: 'create-pr',
      name: 'Create Stage Transition PR',
      condition: ({ results }) => results['commit-to-next-stage'],
      action: async ({ context, results }) => {
        const { currentStage, nextStage } = results['detect-stage'];
        const { generated } = results['generate-next-stage'];
        
        const github = new GitHubFuturesClient(
          context.githubToken,
          context.repo.owner
        );
        
        const pr = await github.createStagePR(
          context.repo.name,
          currentStage,
          nextStage,
          generated
        );
        
        return { pr };
      }
    },
    
    {
      id: 'auto-review',
      name: 'AI Review and Auto-Merge',
      condition: ({ results }) => results['create-pr'],
      action: async ({ results, agents }) => {
        const { pr } = results['create-pr'];
        
        // AI reviews the PR
        const review = await agents.cofounder.reviewPR(pr);
        
        if (review.approved && review.confidence > 0.8) {
          // Auto-merge
          await github.pulls.merge({
            owner: context.repo.owner,
            repo: context.repo.name,
            pull_number: pr.number,
            merge_method: 'squash'
          });
          
          return { merged: true, review };
        }
        
        return { merged: false, review };
      }
    }
  ]
});

// Helper functions
function getNextStage(current: string): string {
  const stages = [
    'requirements',
    'analysis',
    'design',
    'implementation',
    'testing',
    'validation',
    'deployment'
  ];
  
  const index = stages.indexOf(current);
  return index < stages.length - 1 ? stages[index + 1] : 'deployment';
}

function checkRequirementsComplete(content: any) {
  // Must have: requirements, assumptions (validated), goals
  const hasRequirements = content['REQUIREMENTS.md']?.length > 100;
  const hasAssumptions = content['ASSUMPTIONS.md']?.length > 0;
  const hasGoals = content['GOALS.md']?.length > 0;
  
  // Parse assumptions to check validation
  const assumptions = parseAssumptions(content['ASSUMPTIONS.md'] || '');
  const critical = assumptions.filter(a => a.criticality > 0.7);
  const validated = critical.filter(a => a.validated);
  const validationRate = validated.length / critical.length;
  
  const complete = hasRequirements && hasAssumptions && hasGoals && validationRate >= 0.8;
  
  return {
    complete,
    reason: complete ? 'Requirements stage complete' : 'Requirements incomplete',
    details: {
      hasRequirements,
      hasAssumptions,
      hasGoals,
      criticalValidationRate: validationRate
    }
  };
}

function checkImplementationComplete(content: any) {
  // Must have: source code, tests, coverage >80%
  const hasCode = content['src/'] || content['implementation/src/'];
  const hasTests = content['tests/'] || content['implementation/tests/'];
  
  // Would check test results from CI
  return {
    complete: hasCode && hasTests,
    reason: hasCode && hasTests ? 'Implementation complete' : 'Missing code or tests'
  };
}

function parseAssumptions(content: string) {
  // Parse markdown to extract assumptions
  // Format: "## Assumption: ... (criticality: 0.9) [validated]"
  const assumptions: any[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('##')) {
      const match = line.match(/criticality: ([0-9.]+)/);
      const criticality = match ? parseFloat(match[1]) : 0.5;
      const validated = line.includes('[validated]') || line.includes('[x]');
      
      assumptions.push({ criticality, validated });
    }
  }
  
  return assumptions;
}
