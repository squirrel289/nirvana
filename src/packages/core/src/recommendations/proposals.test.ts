import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateSkillRecommendation } from './engine';
import { FileProposalStorage, ProposalService } from './proposals';

async function buildService() {
  const root = await mkdtemp(join(tmpdir(), 'nirvana-proposals-'));
  const filePath = join(root, 'proposals.json');

  const service = new ProposalService(new FileProposalStorage(filePath), () =>
    new Date('2026-03-03T12:00:00.000Z')
  );

  return { root, filePath, service };
}

async function buildRecommendation() {
  return generateSkillRecommendation({
    patternId: 'pattern-approval-loop',
    useCase: 'Automate recurring review-driven skill updates',
    occurrences: 6,
    channels: ['cli', 'ide'],
    modelCohorts: ['gpt-5', 'claude-sonnet'],
    workspaceSpecific: false,
    interactionMode: 'collaborative',
    evidenceIds: ['ep-201', 'ep-202'],
    estimatedTimeSavedMinutes: 35,
    skillOverlaps: [{ skillId: 'update-work-item', overlap: 0.8 }],
  });
}

describe('ProposalService', () => {
  const cleanupRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(cleanupRoots.map((root) => rm(root, { recursive: true, force: true })));
    cleanupRoots.length = 0;
  });

  it('stores recommendations as pending proposals in procedural storage', async () => {
    const { root, filePath, service } = await buildService();
    cleanupRoots.push(root);

    const recommendation = await buildRecommendation();
    const proposal = await service.createProposal(recommendation);

    expect(proposal.status).toBe('pending');

    const persisted = JSON.parse(await readFile(filePath, 'utf8'));
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe(proposal.id);
  });

  it('requires approval before skill-creator delegation', async () => {
    const { root, service } = await buildService();
    cleanupRoots.push(root);

    const proposal = await service.createProposal(await buildRecommendation());

    await expect(service.buildSkillCreatorInvocation(proposal.id)).rejects.toThrow(
      'requires explicit approval'
    );

    await service.reviewProposal(proposal.id, {
      reviewer: 'maintainer',
      reason: 'Matches repeated review feedback trends.',
      status: 'approved',
    });

    const invocation = await service.buildSkillCreatorInvocation(proposal.id);

    expect(invocation.executor).toBe('skill-creator');
    expect(invocation.action).toBe('enhance');
    expect(invocation.payload.patternId).toBe('pattern-approval-loop');
    expect(invocation.payload.evidenceIds).toEqual(['ep-201', 'ep-202']);
  });

  it('tracks rejected proposals and computes approval analytics', async () => {
    const { root, service } = await buildService();
    cleanupRoots.push(root);

    const approved = await service.createProposal(await buildRecommendation());
    const rejected = await service.createProposal(
      await generateSkillRecommendation({
        patternId: 'pattern-low-confidence',
        useCase: 'One-off task that should stay manual',
        occurrences: 2,
        channels: ['cli'],
        modelCohorts: ['gpt-5'],
        workspaceSpecific: true,
        interactionMode: 'collaborative',
      })
    );

    await service.reviewProposal(approved.id, {
      reviewer: 'maintainer',
      reason: 'High confidence and reuse potential.',
      status: 'approved',
    });

    await service.reviewProposal(rejected.id, {
      reviewer: 'maintainer',
      reason: 'Insufficient repeat signal.',
      status: 'rejected',
    });

    const analytics = await service.getAnalytics();
    expect(analytics.total).toBe(2);
    expect(analytics.statusCounts.approved).toBe(1);
    expect(analytics.statusCounts.rejected).toBe(1);
    expect(analytics.byRecommendationType.enhance_existing.approvalRate).toBe(1);
    expect(analytics.byRecommendationType.create_project_skill.approvalRate).toBe(0);
  });

  it('renders CLI review output with rationale context', async () => {
    const { root, service } = await buildService();
    cleanupRoots.push(root);

    const proposal = await service.createProposal(await buildRecommendation());
    await service.reviewProposal(proposal.id, {
      reviewer: 'maintainer',
      reason: 'Approved for rollout',
      status: 'approved',
    });

    const rendered = await service.renderReviewInterface();

    expect(rendered).toContain('ID | Status | Type | Confidence | ROI | Use Case');
    expect(rendered).toContain('enhance_existing');
    expect(rendered).toContain('Automate recurring review-driven skill updates');
  });

  it('marks approved proposals as implemented with execution reference', async () => {
    const { root, service } = await buildService();
    cleanupRoots.push(root);

    const proposal = await service.createProposal(await buildRecommendation());
    await service.reviewProposal(proposal.id, {
      reviewer: 'maintainer',
      reason: 'Approved for execution',
      status: 'approved',
    });

    const implemented = await service.markImplemented(proposal.id, 'skill-creator-run-9');

    expect(implemented.status).toBe('implemented');
    expect(implemented.implementationRef).toBe('skill-creator-run-9');
  });
});
