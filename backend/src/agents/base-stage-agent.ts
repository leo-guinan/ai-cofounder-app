import { Agent } from '@mastra/core';
import { GitHubFuturesClient } from '../github/client';

/**
 * Base Stage Agent
 * 
 * Creates a stage-locked agent that can only work on a specific SDLC phase.
 * This ensures:
 * - All decisions are committed to the correct branch
 * - Agent context is phase-specific
 * - No cross-contamination between phases
 * - Clear separation of concerns in the waterfall
 */

export interface StageAgentConfig {
  stage: 'requirements' | 'analysis' | 'design' | 'implementation' | 'testing' | 'validation';
  repoName: string;
  githubToken: string;
  githubUser: string;
  ideaContext?: any;
}

export class BaseStageAgent {
  private stage: string;
  private repoName: string;
  private github: GitHubFuturesClient;
  private agent: Agent;
  private ideaContext: any;
  
  constructor(config: StageAgentConfig) {
    this.stage = config.stage;
    this.repoName = config.repoName;
    this.github = new GitHubFuturesClient(config.githubToken, config.githubUser);
    this.ideaContext = config.ideaContext || {};
    
    // Create stage-specific agent
    this.agent = this.createStageAgent();
  }
  
  private createStageAgent(): Agent {
    return new Agent({
      name: `${this.stage}-agent`,
      instructions: this.getStageInstructions(),
      model: {
        provider: 'openai',
        name: 'gpt-4',
        toolChoice: 'auto'
      } as any,
      tools: this.getStageTools() as any
    });
  }
  
  private getStageInstructions(): string {
    const baseInstructions = `
You are an AI cofounder helping a non-technical founder with the ${this.stage.toUpperCase()} phase of their startup development.

**CRITICAL RULES:**
1. You can ONLY work on the ${this.stage} branch
2. All your decisions and content go into ${this.stage} branch
3. You cannot access or modify other phases
4. Focus exclusively on ${this.stage} phase deliverables

**Your Repository:** ${this.repoName}
**Your Branch:** ${this.stage}
**Your Phase:** ${this.stage.toUpperCase()}
`;
    
    const stageSpecificInstructions = {
      requirements: `
**REQUIREMENTS PHASE FOCUS:**
- Define the problem clearly
- Identify target users
- Document core features
- List critical assumptions
- Set success criteria

**Deliverables:**
- REQUIREMENTS.md (problem, users, features)
- ASSUMPTIONS.md (assumptions with validation methods)
- GOALS.md (business goals and metrics)
`,
      analysis: `
**ANALYSIS PHASE FOCUS:**
- Identify biggest unknowns
- Define MVP scope
- Analyze technical feasibility
- Research competition
- Assess risks

**Deliverables:**
- ANALYSIS.md (unknowns, MVP definition)
- COMPETITIVE_ANALYSIS.md
- RISK_ASSESSMENT.md
`,
      design: `
**DESIGN PHASE FOCUS:**
- Design user experience
- Create wireframes and flows
- Define technical architecture
- Plan API endpoints
- Database schema design

**Deliverables:**
- UX_DESIGN.md (user journeys, wireframes)
- TECHNICAL_ARCHITECTURE.md
- API_SPEC.md
- DATABASE_SCHEMA.md
`,
      implementation: `
**IMPLEMENTATION PHASE FOCUS:**
- Write production code
- Implement features
- Follow best practices
- Create tests
- Document code

**Deliverables:**
- Source code in src/
- Tests in tests/
- README with setup instructions
- CHANGELOG.md
`,
      testing: `
**TESTING PHASE FOCUS:**
- Write comprehensive tests
- Test coverage >80%
- Integration testing
- Performance testing
- Bug fixing

**Deliverables:**
- Unit tests
- Integration tests
- E2E tests
- TEST_REPORT.md
- BUG_LOG.md
`,
      validation: `
**VALIDATION PHASE FOCUS:**
- User testing plan
- Feedback collection
- Metrics tracking
- Iteration planning
- Launch preparation

**Deliverables:**
- VALIDATION_PLAN.md
- USER_FEEDBACK.md
- METRICS_REPORT.md
- LAUNCH_CHECKLIST.md
`
    };
    
    return baseInstructions + (stageSpecificInstructions[this.stage as keyof typeof stageSpecificInstructions] || '');
  }
  
  private getStageTools() {
    // Base tools available to all stages
    const baseTools = [
      {
        description: 'Read file from current stage branch',
        parameters: {
          filename: { type: 'string', description: 'File path to read' }
        },
        execute: async ({ filename }: any) => {
          try {
            const file = await this.github.octokit.repos.getContent({
              owner: this.github.owner,
              repo: this.repoName,
              path: filename,
              ref: this.stage
            });
            
            if ('content' in file.data) {
              const content = Buffer.from(file.data.content, 'base64').toString('utf-8');
              return { success: true, content };
            }
            
            return { success: false, error: 'Not a file' };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        }
      },
      
      {
        description: 'Write or update file in current stage branch',
        parameters: {
          filename: { type: 'string', description: 'File path to write' },
          content: { type: 'string', description: 'File content' },
          message: { type: 'string', description: 'Commit message' }
        },
        execute: async ({ filename, content, message }: any) => {
          try {
            // Check if file exists
            let sha: string | undefined;
            try {
              const existing = await this.github.octokit.repos.getContent({
                owner: this.github.owner,
                repo: this.repoName,
                path: filename,
                ref: this.stage
              });
              
              if ('sha' in existing.data) {
                sha = existing.data.sha;
              }
            } catch {
              // File doesn't exist, that's fine
            }
            
            await this.github.octokit.repos.createOrUpdateFileContents({
              owner: this.github.owner,
              repo: this.repoName,
              path: filename,
              message: `${this.stage}: ${message}`,
              content: Buffer.from(content).toString('base64'),
              branch: this.stage,
              ...(sha && { sha })
            });
            
            return { 
              success: true, 
              message: `File ${filename} written to ${this.stage} branch`,
              branch: this.stage
            };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        }
      },
      
      {
        description: 'List files in current stage branch',
        parameters: {
          path: { type: 'string', description: 'Directory path (default: root)', default: '' }
        },
        execute: async ({ path = '' }: any) => {
          try {
            const contents = await this.github.octokit.repos.getContent({
              owner: this.github.owner,
              repo: this.repoName,
              path,
              ref: this.stage
            });
            
            if (Array.isArray(contents.data)) {
              const files = contents.data.map((item: any) => ({
                name: item.name,
                type: item.type,
                path: item.path
              }));
              
              return { success: true, files };
            }
            
            return { success: false, error: 'Not a directory' };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        }
      },
      
      {
        description: 'Make a decision (creates a DECISIONS.md entry)',
        parameters: {
          decisionName: { type: 'string', description: 'Name of the decision' },
          alternatives: { type: 'array', description: 'Alternative options considered' },
          chosen: { type: 'string', description: 'Chosen option' },
          reasoning: { type: 'string', description: 'Why this was chosen' },
          confidence: { type: 'number', description: 'Confidence 0-100' }
        },
        execute: async ({ decisionName, alternatives, chosen, reasoning, confidence }: any) => {
          const decisionEntry = `
## Decision: ${decisionName}
**Date:** ${new Date().toISOString()}
**Stage:** ${this.stage}

**Alternatives Considered:**
${alternatives.map((alt: string, i: number) => `${i + 1}. ${alt}`).join('\n')}

**Chosen:** ${chosen}

**Reasoning:** ${reasoning}

**Confidence:** ${confidence}%

---
`;
          
          // Append to DECISIONS.md
          let currentContent = '';
          try {
            const file = await this.github.octokit.repos.getContent({
              owner: this.github.owner,
              repo: this.repoName,
              path: 'DECISIONS.md',
              ref: this.stage
            });
            
            if ('content' in file.data) {
              currentContent = Buffer.from(file.data.content, 'base64').toString('utf-8');
            }
          } catch {
            // File doesn't exist, create new
            currentContent = `# Decisions Log - ${this.stage} Phase\n\n`;
          }
          
          const newContent = currentContent + decisionEntry;
          
          // Write updated file
          const result = await this.getStageTools()[1].execute({
            filename: 'DECISIONS.md',
            content: newContent,
            message: `Add decision: ${decisionName}`
          });
          
          return result;
        }
      }
    ];
    
    return baseTools;
  }
  
  /**
   * Chat with the stage agent
   */
  async chat(message: string, conversationHistory?: any[]) {
    const context = {
      stage: this.stage,
      repoName: this.repoName,
      branch: this.stage,
      ideaContext: this.ideaContext,
      history: conversationHistory || []
    };
    
    return await this.agent.chat({
      message,
      context
    });
  }
  
  /**
   * Execute a specific tool
   */
  async executeTool(toolName: string, parameters: any) {
    const tools = this.getStageTools();
    const tool = tools.find(t => t.description.includes(toolName));
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    return await tool.execute(parameters);
  }
  
  /**
   * Get current stage branch status
   */
  async getStageStatus() {
    try {
      const files = await this.executeTool('List files', { path: '' });
      const branch = await this.github.octokit.repos.getBranch({
        owner: this.github.owner,
        repo: this.repoName,
        branch: this.stage
      });
      
      return {
        stage: this.stage,
        branch: this.stage,
        files: files.files || [],
        lastCommit: {
          sha: branch.data.commit.sha,
          message: branch.data.commit.commit.message,
          date: branch.data.commit.commit.author?.date
        }
      };
    } catch (error: any) {
      return {
        stage: this.stage,
        branch: this.stage,
        error: error.message
      };
    }
  }
  
  /**
   * Check if stage is complete
   */
  async isStageComplete(): Promise<{complete: boolean; reason: string; details?: any}> {
    // This would be overridden by stage-specific completion checks
    return {
      complete: false,
      reason: 'Stage completion check not implemented'
    };
  }
}
