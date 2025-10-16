import { Workflow } from '@mastra/core';
import { z } from 'zod';
import { BaseStageAgent } from '../agents/base-stage-agent';

/**
 * Requirements Phase Workflow
 * 
 * Guides the founder through:
 * 1. Problem definition
 * 2. Target user identification
 * 3. Core features listing
 * 4. Assumptions documentation
 * 5. Success criteria definition
 * 
 * Deliverables:
 * - REQUIREMENTS.md
 * - ASSUMPTIONS.md
 * - GOALS.md
 * - DECISIONS.md
 */

export const requirementsWorkflow = new Workflow({
  id: 'requirements-phase',
  description: 'Complete the Requirements phase of waterfall development',
  
  inputSchema: z.object({
    repoName: z.string(),
    githubToken: z.string(),
    githubUser: z.string(),
    ideaDescription: z.string(),
    founderContext: z.object({}).passthrough().optional()
  }),
  
  outputSchema: z.object({
    complete: z.boolean(),
    deliverables: z.array(z.string()),
    readyForNextStage: z.boolean()
  }),
  
  steps: [
    {
      id: 'initialize-agent',
      description: 'Create requirements-locked agent',
      action: async ({ context }: any) => {
        const agent = new BaseStageAgent({
          stage: 'requirements',
          repoName: context.repoName,
          githubToken: context.githubToken,
          githubUser: context.githubUser,
          ideaContext: {
            description: context.ideaDescription,
            founder: context.founderContext
          }
        });
        
        return { agent, initialized: true };
      }
    },
    
    {
      id: 'define-problem',
      description: 'Guide founder to clearly define the problem',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        const response = await agent.chat(`
Help me clearly define the problem this startup will solve.

Current idea description: ${results['initialize-agent'].agent.ideaContext.description}

Please help me:
1. Identify the core problem
2. Understand who experiences this problem
3. Quantify the problem's impact
4. Explain why existing solutions are insufficient

Format your response as a structured problem statement and write it to REQUIREMENTS.md under "## Problem Statement"
`);
        
        return {
          problemDefined: true,
          aiResponse: response
        };
      }
    },
    
    {
      id: 'identify-target-users',
      description: 'Identify and document target users',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        const response = await agent.chat(`
Based on the problem we defined, help me identify the target users.

Please help me create:
1. Primary user persona (demographics, behaviors, pain points)
2. Secondary user personas if applicable
3. User needs and goals
4. Use cases and scenarios

Write this to REQUIREMENTS.md under "## Target Users"
`);
        
        return {
          usersIdentified: true,
          aiResponse: response
        };
      }
    },
    
    {
      id: 'define-core-features',
      description: 'List and prioritize core features',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        const response = await agent.chat(`
Help me define the core features needed to solve the problem for our target users.

Please help me:
1. List essential features (must-haves)
2. List nice-to-have features
3. Prioritize by user value
4. Identify technical dependencies

Write this to REQUIREMENTS.md under "## Core Features" with MoSCoW prioritization:
- Must Have
- Should Have
- Could Have
- Won't Have (for now)
`);
        
        return {
          featuresDefined: true,
          aiResponse: response
        };
      }
    },
    
    {
      id: 'document-assumptions',
      description: 'Identify and document critical assumptions',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        const response = await agent.chat(`
Help me identify all critical assumptions we're making about:
- The problem
- The users
- The solution
- The market
- Technical feasibility

For each assumption, provide:
1. The assumption statement
2. How critical it is (High/Medium/Low)
3. How we can validate it
4. Risk if the assumption is wrong

Write this to ASSUMPTIONS.md in a structured format.
`);
        
        return {
          assumptionsDocumented: true,
          aiResponse: response
        };
      }
    },
    
    {
      id: 'define-success-criteria',
      description: 'Set measurable success criteria',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        const response = await agent.chat(`
Help me define success criteria for this startup.

Please help me create:
1. Business goals (revenue, users, market share)
2. User success metrics (engagement, retention, satisfaction)
3. Technical metrics (performance, reliability)
4. Timeline milestones
5. MVP success criteria

Write this to GOALS.md with SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound).
`);
        
        return {
          goalsDefined: true,
          aiResponse: response
        };
      }
    },
    
    {
      id: 'validate-completeness',
      description: 'Check if requirements phase is complete',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        // Read all deliverables
        const requirements = await agent.executeTool('Read file', { filename: 'REQUIREMENTS.md' });
        const assumptions = await agent.executeTool('Read file', { filename: 'ASSUMPTIONS.md' });
        const goals = await agent.executeTool('Read file', { filename: 'GOALS.md' });
        
        // Check completeness
        const hasRequirements = requirements.success && requirements.content.length > 200;
        const hasAssumptions = assumptions.success && assumptions.content.includes('##');
        const hasGoals = goals.success && goals.content.includes('##');
        
        // Count critical assumptions
        const assumptionLines = assumptions.content?.split('\n') || [];
        const criticalAssumptions = assumptionLines.filter((line: string) => 
          line.includes('High') || line.includes('Critical')
        ).length;
        
        const complete = hasRequirements && hasAssumptions && hasGoals && criticalAssumptions >= 3;
        
        return {
          complete,
          hasRequirements,
          hasAssumptions,
          hasGoals,
          criticalAssumptions,
          reason: complete ? 'Requirements phase complete' : 'Missing deliverables or insufficient detail'
        };
      }
    },
    
    {
      id: 'create-stage-summary',
      description: 'Create summary of requirements phase',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        const validation = results['validate-completeness'];
        
        const summary = `# Requirements Phase Summary

## Completion Status
- Requirements Defined: ${validation.hasRequirements ? '✅' : '❌'}
- Assumptions Documented: ${validation.hasAssumptions ? '✅' : '❌'}
- Goals Set: ${validation.hasGoals ? '✅' : '❌'}
- Critical Assumptions: ${validation.criticalAssumptions}

## Deliverables
- [${validation.hasRequirements ? 'x' : ' '}] REQUIREMENTS.md
- [${validation.hasAssumptions ? 'x' : ' '}] ASSUMPTIONS.md
- [${validation.hasGoals ? 'x' : ' '}] GOALS.md
- [x] DECISIONS.md

## Readiness for Analysis Phase
${validation.complete ? '✅ READY - All requirements documented and validated' : '❌ NOT READY - Complete missing items above'}

## Next Steps
${validation.complete ? `
1. Review and validate critical assumptions
2. Move to Analysis phase
3. Identify unknowns and risks
4. Define MVP scope
` : `
1. Complete missing deliverables
2. Add more critical assumptions
3. Validate problem-solution fit
4. Get feedback from potential users
`}

---
Generated: ${new Date().toISOString()}
`;
        
        await agent.executeTool('Write or update file', {
          filename: 'REQUIREMENTS_SUMMARY.md',
          content: summary,
          message: 'Add requirements phase summary'
        });
        
        return {
          summaryCreated: true,
          readyForNextStage: validation.complete
        };
      }
    }
  ] as any
});
