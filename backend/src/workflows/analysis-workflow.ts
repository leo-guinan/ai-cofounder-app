import { Workflow } from '@mastra/core';
import { z } from 'zod';
import { BaseStageAgent } from '../agents/base-stage-agent';

/**
 * Analysis Phase Workflow
 * 
 * Guides the founder through:
 * 1. Identifying biggest unknowns
 * 2. Defining MVP scope
 * 3. Technical feasibility assessment
 * 4. Competitive analysis
 * 5. Risk assessment
 * 
 * Deliverables:
 * - ANALYSIS.md
 * - COMPETITIVE_ANALYSIS.md
 * - RISK_ASSESSMENT.md
 * - MVP_DEFINITION.md
 * - DECISIONS.md
 */

export const analysisWorkflow = new Workflow({
  id: 'analysis-phase',
  description: 'Complete the Analysis phase of waterfall development',
  
  inputSchema: z.object({
    repoName: z.string(),
    githubToken: z.string(),
    githubUser: z.string(),
    requirementsContext: z.object({}).passthrough()
  }),
  
  outputSchema: z.object({
    complete: z.boolean(),
    deliverables: z.array(z.string()),
    readyForNextStage: z.boolean()
  }),
  
  steps: [
    {
      id: 'initialize-agent',
      description: 'Create analysis-locked agent',
      action: async ({ context }: any) => {
        const agent = new BaseStageAgent({
          stage: 'analysis',
          repoName: context.repoName,
          githubToken: context.githubToken,
          githubUser: context.githubUser,
          ideaContext: context.requirementsContext
        });
        
        return { agent, initialized: true };
      }
    },
    
    {
      id: 'identify-unknowns',
      description: 'Identify biggest unknowns and risks',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        // First, read requirements from requirements branch
        const response = await agent.chat(`
Based on the requirements we defined, help me identify the biggest unknowns.

Please analyze:
1. **Market Unknowns**: Is there real demand? Will users pay? Market size?
2. **Technical Unknowns**: Can we build this? Technical complexity? Dependencies?
3. **Business Model Unknowns**: Revenue model? Pricing? Cost structure?
4. **User Unknowns**: Will they actually use it? Behavior patterns? Adoption barriers?
5. **Competitive Unknowns**: Who else is doing this? Why will we win?

For each unknown:
- State the unknown clearly
- Rate its impact (High/Medium/Low)
- Suggest how to validate it
- Estimate time to validate

Write this to ANALYSIS.md under "## Biggest Unknowns"
`);
        
        return {
          unknownsIdentified: true,
          aiResponse: response
        };
      }
    },
    
    {
      id: 'define-mvp',
      description: 'Define Minimum Viable Product scope',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        const response = await agent.chat(`
Help me define a true MVP - the smallest version that validates our core hypothesis.

Please help me:
1. Identify the ONE core value proposition we must prove
2. List absolute minimum features (3-5 max)
3. Define what we're explicitly NOT building
4. Set MVP success metrics
5. Estimate timeline (should be 8-12 weeks max)

Write this to MVP_DEFINITION.md with:
- Core Hypothesis to Test
- Must-Have Features (only)
- Explicitly Excluded
- Success Metrics
- Timeline

Remember: MVP should take weeks, not months!
`);
        
        return {
          mvpDefined: true,
          aiResponse: response
        };
      }
    },
    
    {
      id: 'competitive-analysis',
      description: 'Analyze competitive landscape',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        const response = await agent.chat(`
Help me analyze the competitive landscape.

Research and document:
1. **Direct Competitors**: Who solves the exact same problem?
2. **Indirect Competitors**: Alternative solutions users might choose
3. **Competitive Advantages**: Why we can win
4. **Competitive Weaknesses**: Where we might struggle
5. **Market Position**: Where we fit in the landscape

For each competitor, document:
- Name and description
- Their approach/solution
- Their strengths
- Their weaknesses
- Our differentiation

Write this to COMPETITIVE_ANALYSIS.md
`);
        
        return {
          competitiveAnalysisComplete: true,
          aiResponse: response
        };
      }
    },
    
    {
      id: 'assess-risks',
      description: 'Comprehensive risk assessment',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        const response = await agent.chat(`
Help me assess all major risks to this startup.

Analyze risks in:
1. **Market Risk**: Market might not exist, might be too small, or saturated
2. **Technical Risk**: Can't build it, too complex, or technical blockers
3. **Team Risk**: Missing skills, capacity issues, or founder conflict
4. **Financial Risk**: Not enough runway, burn rate too high
5. **Execution Risk**: Can't ship fast enough, quality issues
6. **Regulatory Risk**: Legal/compliance issues

For each risk:
- Description
- Likelihood (High/Medium/Low)
- Impact (High/Medium/Low)
- Mitigation strategy
- Early warning signs

Write this to RISK_ASSESSMENT.md with risks prioritized by (Likelihood × Impact)
`);
        
        return {
          risksAssessed: true,
          aiResponse: response
        };
      }
    },
    
    {
      id: 'technical-feasibility',
      description: 'Assess technical feasibility',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        const response = await agent.chat(`
Help me assess technical feasibility of the MVP.

Analyze:
1. **Technology Stack**: What tech should we use and why?
2. **Technical Complexity**: On a scale of 1-10, how hard to build?
3. **Dependencies**: External APIs, services, or tools needed
4. **Technical Risks**: What could go wrong technically?
5. **Development Timeline**: Realistic estimate for MVP
6. **Team Capabilities**: Skills needed vs. available

Make recommendations for:
- Frontend technology
- Backend technology
- Database
- Hosting/Infrastructure
- Third-party services

Append this to ANALYSIS.md under "## Technical Feasibility"
`);
        
        return {
          feasibilityAssessed: true,
          aiResponse: response
        };
      }
    },
    
    {
      id: 'validate-completeness',
      description: 'Check if analysis phase is complete',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        
        const analysis = await agent.executeTool('Read file', { filename: 'ANALYSIS.md' });
        const mvp = await agent.executeTool('Read file', { filename: 'MVP_DEFINITION.md' });
        const competitive = await agent.executeTool('Read file', { filename: 'COMPETITIVE_ANALYSIS.md' });
        const risks = await agent.executeTool('Read file', { filename: 'RISK_ASSESSMENT.md' });
        
        const hasAnalysis = analysis.success && analysis.content.includes('Biggest Unknowns');
        const hasMVP = mvp.success && mvp.content.includes('Core Hypothesis');
        const hasCompetitive = competitive.success && competitive.content.length > 300;
        const hasRisks = risks.success && risks.content.includes('Risk');
        
        // Check for minimum number of items
        const unknownsCount = (analysis.content?.match(/##.*Unknown/g) || []).length;
        const risksCount = (risks.content?.match(/###/g) || []).length;
        const competitorsCount = (competitive.content?.match(/###.*Competitor/gi) || []).length;
        
        const complete = hasAnalysis && hasMVP && hasCompetitive && hasRisks &&
                        unknownsCount >= 5 && risksCount >= 5 && competitorsCount >= 3;
        
        return {
          complete,
          hasAnalysis,
          hasMVP,
          hasCompetitive,
          hasRisks,
          unknownsCount,
          risksCount,
          competitorsCount,
          reason: complete ? 'Analysis phase complete' : 'Incomplete analysis - need more depth'
        };
      }
    },
    
    {
      id: 'create-stage-summary',
      description: 'Create summary of analysis phase',
      action: async ({ results }: any) => {
        const agent = results['initialize-agent'].agent;
        const validation = results['validate-completeness'];
        
        const summary = `# Analysis Phase Summary

## Completion Status
- Unknowns Identified: ${validation.hasAnalysis ? '✅' : '❌'} (${validation.unknownsCount} unknowns)
- MVP Defined: ${validation.hasMVP ? '✅' : '❌'}
- Competitive Analysis: ${validation.hasCompetitive ? '✅' : '❌'} (${validation.competitorsCount} competitors)
- Risk Assessment: ${validation.hasRisks ? '✅' : '❌'} (${validation.risksCount} risks)

## Deliverables
- [${validation.hasAnalysis ? 'x' : ' '}] ANALYSIS.md
- [${validation.hasMVP ? 'x' : ' '}] MVP_DEFINITION.md
- [${validation.hasCompetitive ? 'x' : ' '}] COMPETITIVE_ANALYSIS.md
- [${validation.hasRisks ? 'x' : ' '}] RISK_ASSESSMENT.md
- [x] DECISIONS.md

## Readiness for Design Phase
${validation.complete ? '✅ READY - Sufficient analysis to proceed' : '❌ NOT READY - Need more analysis'}

## Key Findings
- **Biggest Unknowns**: ${validation.unknownsCount} identified
- **Competitive Position**: ${validation.competitorsCount} competitors analyzed
- **Risk Level**: ${validation.risksCount} risks documented

## Next Steps
${validation.complete ? `
1. Move to Design phase
2. Create user experience designs
3. Define technical architecture
4. Plan API and database schema
` : `
1. Identify more unknowns (need ${Math.max(0, 5 - validation.unknownsCount)} more)
2. Analyze more competitors (need ${Math.max(0, 3 - validation.competitorsCount)} more)
3. Document more risks (need ${Math.max(0, 5 - validation.risksCount)} more)
4. Refine MVP definition
`}

---
Generated: ${new Date().toISOString()}
`;
        
        await agent.executeTool('Write or update file', {
          filename: 'ANALYSIS_SUMMARY.md',
          content: summary,
          message: 'Add analysis phase summary'
        });
        
        return {
          summaryCreated: true,
          readyForNextStage: validation.complete
        };
      }
    }
  ] as any,
  
  onComplete: async ({ results }) => {
    const validation = results['validate-completeness'];
    const summary = results['create-stage-summary'];
    
    return {
      complete: validation.complete,
      deliverables: [
        'ANALYSIS.md',
        'MVP_DEFINITION.md',
        'COMPETITIVE_ANALYSIS.md',
        'RISK_ASSESSMENT.md',
        'DECISIONS.md',
        'ANALYSIS_SUMMARY.md'
      ],
      readyForNextStage: summary.readyForNextStage
    };
  }
});
