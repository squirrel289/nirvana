import { ProposalRecord } from './proposals';

export function formatProposalReviewList(proposals: ProposalRecord[]): string {
  if (proposals.length === 0) {
    return 'No proposals available for review.';
  }

  const lines = [
    'ID | Status | Type | Confidence | Use Case',
    '---|---|---|---|---',
  ];

  for (const proposal of proposals) {
    lines.push(
      [
        proposal.id,
        proposal.status,
        proposal.recommendation.summary.recommendationType,
        proposal.recommendation.summary.confidence.toFixed(2),
        proposal.recommendation.summary.useCase,
      ].join(' | ')
    );
  }

  return lines.join('\n');
}
