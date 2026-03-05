import { ProposalRecord } from './proposals';

export function formatProposalReviewList(proposals: ProposalRecord[]): string {
  if (proposals.length === 0) {
    return 'No proposals available for review.';
  }

  const ranked = [...proposals].sort((left, right) => {
    const leftRoi = left.recommendation.evidence.efficiency.forecast.roi;
    const rightRoi = right.recommendation.evidence.efficiency.forecast.roi;

    if (rightRoi !== leftRoi) {
      return rightRoi - leftRoi;
    }

    return right.recommendation.summary.confidence - left.recommendation.summary.confidence;
  });

  const lines = [
    'ID | Status | Type | Confidence | ROI | Use Case',
    '---|---|---|---|---|---',
  ];

  for (const proposal of ranked) {
    lines.push(
      [
        proposal.id,
        proposal.status,
        proposal.recommendation.summary.recommendationType,
        proposal.recommendation.summary.confidence.toFixed(2),
        proposal.recommendation.summary.roiForecast.toFixed(2),
        proposal.recommendation.summary.useCase,
      ].join(' | ')
    );
  }

  return lines.join('\n');
}
