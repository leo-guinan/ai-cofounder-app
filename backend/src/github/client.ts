import { Octokit } from '@octokit/rest';
import { config } from '../config';

/**
 * GitHub client for Possible Futures
 * 
 * Each idea = repository
 * Each stage = branch
 * Each decision = commit
 */

export class GitHubFuturesClient {
  private _octokit: Octokit;
  private _owner: string;
  
  constructor(token: string, owner: string) {
    this._octokit = new Octokit({ auth: token });
    this._owner = owner;
  }
  
  // Public getters for workflows and agents
  get octokit() {
    return this._octokit;
  }
  
  get owner() {
    return this._owner;
  }
  
  /**
   * Create a new idea as a GitHub repository
   */
  async createIdea(name: string, description: string): Promise<string> {
    const repoName = `idea-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    const repo = await this._octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description,
      private: true,
      auto_init: true,
    });
    
    // Create waterfall branches
    await this.createWaterfallBranches(repoName);
    
    // Initialize with templates
    await this.initializeRequirements(repoName);
    
    return repo.data.full_name;
  }
  
  /**
   * Create all waterfall stage branches
   */
  async createWaterfallBranches(repoName: string) {
    const stages = [
      'requirements',
      'analysis',
      'design',
      'implementation',
      'testing',
      'validation',
      'deployment'
    ];
    
    // Get main branch SHA
    const { data: mainBranch } = await this._octokit.repos.getBranch({
      owner: this._owner,
      repo: repoName,
      branch: 'main'
    });
    
    // Create each stage branch
    for (const stage of stages) {
      await this._octokit.git.createRef({
        owner: this._owner,
        repo: repoName,
        ref: `refs/heads/${stage}`,
        sha: mainBranch.commit.sha
      });
    }
    
    // For implementation, create develop and production sub-branches
    const { data: implBranch } = await this._octokit.repos.getBranch({
      owner: this._owner,
      repo: repoName,
      branch: 'implementation'
    });
    
    await this._octokit.git.createRef({
      owner: this._owner,
      repo: repoName,
      ref: 'refs/heads/implementation/develop',
      sha: implBranch.commit.sha
    });
    
    await this._octokit.git.createRef({
      owner: this._owner,
      repo: repoName,
      ref: 'refs/heads/implementation/production',
      sha: implBranch.commit.sha
    });
  }
  
  /**
   * Initialize requirements branch with templates
   */
  async initializeRequirements(repoName: string) {
    const files = {
      'README.md': this.generateReadmeTemplate(),
      'REQUIREMENTS.md': this.generateRequirementsTemplate(),
      'ASSUMPTIONS.md': this.generateAssumptionsTemplate(),
      'GOALS.md': this.generateGoalsTemplate(),
      'DECISIONS.log': '# Decision History\n\n'
    };
    
    for (const [path, content] of Object.entries(files)) {
      await this._octokit.repos.createOrUpdateFileContents({
        owner: this._owner,
        repo: repoName,
        path,
        message: `init: create ${path}`,
        content: Buffer.from(content).toString('base64'),
        branch: 'requirements'
      });
    }
  }
  
  /**
   * Make a decision (commit to branch)
   */
  async makeDecision(
    repoName: string,
    branch: string,
    decision: {
      name: string;
      type: string;
      alternatives: string[];
      chosen: string;
      reason: string;
      confidence: number;
      revisitProbability: number;
    }
  ) {
    // Check if decision already made
    const existing = await this.findDecision(repoName, decision.name);
    
    if (existing) {
      console.log('Decision already made:', existing);
      
      // Only revisit if high probability needed
      if (decision.revisitProbability < 0.7) {
        return existing;
      }
      
      console.log('Revisiting decision (high reversal probability)...');
    }
    
    // Create decision commit
    const commitMessage = `decision: ${decision.name}

Decision Type: ${decision.type}
Alternatives Considered: ${decision.alternatives.join(', ')}
Chosen: ${decision.chosen}
Reason: ${decision.reason}
Confidence: ${decision.confidence}
Revisit Probability: ${decision.revisitProbability}
Timestamp: ${new Date().toISOString()}
`;
    
    // Append to DECISIONS.log
    const { data: currentFile } = await this._octokit.repos.getContent({
      owner: this._owner,
      repo: repoName,
      path: 'DECISIONS.log',
      ref: branch
    });
    
    const currentContent = Buffer.from(
      (currentFile as any).content,
      'base64'
    ).toString();
    
    const newContent = currentContent + `\n${commitMessage}\n---\n`;
    
    await this._octokit.repos.createOrUpdateFileContents({
      owner: this._owner,
      repo: repoName,
      path: 'DECISIONS.log',
      message: commitMessage,
      content: Buffer.from(newContent).toString('base64'),
      branch,
      sha: (currentFile as any).sha
    });
    
    return decision;
  }
  
  /**
   * Find if decision already made
   */
  async findDecision(repoName: string, decisionName: string) {
    try {
      const { data: commits } = await this._octokit.repos.listCommits({
        owner: this._owner,
        repo: repoName,
        per_page: 100
      });
      
      const decisionCommit = commits.find(c => 
        c.commit.message.includes(`decision: ${decisionName}`)
      );
      
      if (decisionCommit) {
        // Parse decision from commit message
        return parseDecisionFromCommit(decisionCommit.commit.message);
      }
      
      return null;
    } catch {
      return null;
    }
  }
  
  /**
   * Create PR for stage transition
   */
  async createStagePR(
    repoName: string,
    fromStage: string,
    toStage: string,
    content: any
  ) {
    const pr = await this._octokit.pulls.create({
      owner: this._owner,
      repo: repoName,
      title: `${fromStage} → ${toStage}: Stage transition`,
      head: toStage,
      base: getNextStage(toStage),
      body: this.generatePRBody(fromStage, toStage, content),
      draft: false
    });
    
    return pr.data;
  }
  
  private generateReadmeTemplate(): string {
    return `# Possible Future

This repository tracks a possible future being explored by AI Cofounder.

## Structure

- Each branch = waterfall stage
- Each commit = decision made
- PRs = stage transitions

## Branches

- \`requirements\` - Initial requirements
- \`analysis\` - Analysis and planning
- \`design\` - System design
- \`implementation\` - Code
  - \`implementation/develop\` - Active development
  - \`implementation/production\` - Production code
- \`testing\` - Test results
- \`validation\` - Goal validation
- \`deployment\` - Deployment configs

## Decision History

See DECISIONS.log in each branch for all decisions made.

## Managed By

AI Cofounder using Possible Futures methodology.
`;
  }
  
  private generateRequirementsTemplate(): string {
    return `# Requirements

## Essential State

What we know about this system.

## System Components

Components that need to be built.

## User Stories

What users need to do.

## Non-Functional Requirements

Performance, security, scalability requirements.
`;
  }
  
  private generateAssumptionsTemplate(): string {
    return `# Assumptions

## Critical Assumptions (>0.7 criticality)

Must be validated before advancing past requirements.

## Standard Assumptions

Should be validated but not blocking.

## Validation Status

Track validation progress here.
`;
  }
  
  private generateGoalsTemplate(): string {
    return `# Goals

## Measurable Outcomes

What success looks like (quantifiable).

## Success Metrics

How we'll measure goal achievement.

## Current Status

Track progress toward each goal.
`;
  }
  
  private generatePRBody(from: string, to: string, content: any): string {
    return `## Stage Transition: ${from} → ${to}

### What Changed

${content.summary}

### Decisions Made

${content.decisions?.map((d: any) => `- ${d.name}: ${d.chosen}`).join('\n')}

### Next Steps

This PR progresses the idea to the ${to} stage.

### Validation

- All ${from} requirements met
- Critical assumptions validated
- Ready for ${to} stage

---

*Automated by AI Cofounder Mastra Workflow*
`;
  }
}

function parseDecisionFromCommit(message: string) {
  const lines = message.split('\n');
  const decision: any = {};
  
  for (const line of lines) {
    if (line.startsWith('Decision Type:')) {
      decision.type = line.split(':')[1].trim();
    } else if (line.startsWith('Chosen:')) {
      decision.chosen = line.split(':')[1].trim();
    } else if (line.startsWith('Confidence:')) {
      decision.confidence = parseFloat(line.split(':')[1]);
    } else if (line.startsWith('Revisit Probability:')) {
      decision.revisitProbability = parseFloat(line.split(':')[1]);
    }
  }
  
  return decision;
}

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
