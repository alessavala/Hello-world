import { Campaign, CompensationType, CreatorProfile, CreatorMarketplace, SocialAccount, CreatorCategory } from '@prisma/client';

export type MatchableCreator = CreatorProfile & {
  socialAccounts: SocialAccount[];
  marketplaces: CreatorMarketplace[];
  categories: CreatorCategory[];
};

export interface MatchBreakdown {
  categoryAffinity: number;
  marketplaceCompatibility: number;
  audienceCompatibility: number;
  compensationCompatibility: number;
  historicalPerformance: number;
  reliability: number;
  availability: number;
  total: number;
}

const WEIGHTS = {
  categoryAffinity: 25,
  marketplaceCompatibility: 15,
  audienceCompatibility: 15,
  compensationCompatibility: 10,
  historicalPerformance: 15,
  reliability: 15,
  availability: 5,
};

function compensationCompatible(creator: MatchableCreator, type: CompensationType): boolean {
  switch (type) {
    case 'PRODUCT_ONLY':
      return creator.acceptsProduct;
    case 'FIXED_FEE':
      return creator.acceptsFixedFee;
    case 'EXTERNAL_COMMISSION':
      return creator.acceptsCommission;
    case 'HYBRID':
      return creator.acceptsFixedFee && creator.acceptsProduct;
    default:
      return false;
  }
}

/**
 * Rules-based match score between a creator and a campaign, following the
 * weighted rubric: category 25, marketplace 15, audience 15,
 * compensation/modality 10, historical performance 15, reliability 15,
 * availability 5 = 100. No ML - every factor is a deterministic function of
 * data already on the two records, so results are explainable to brands.
 */
export function computeMatchScore(creator: MatchableCreator, campaign: Campaign): MatchBreakdown {
  const categoryAffinity = creator.categories.some((c) => c.categoryId === campaign.categoryId) ? WEIGHTS.categoryAffinity : 0;

  const marketplaceMatch = creator.marketplaces.find((m) => m.marketplace === campaign.marketplace);
  const marketplaceCompatibility = !marketplaceMatch ? 0 : marketplaceMatch.verified ? WEIGHTS.marketplaceCompatibility : WEIGHTS.marketplaceCompatibility * 0.5;

  const followers = creator.socialAccounts.reduce((max, s) => Math.max(max, s.followers), 0);
  const views = creator.socialAccounts.reduce((max, s) => Math.max(max, s.averageViews), 0);
  const followersRatio = campaign.minFollowers > 0 ? Math.min(1, followers / campaign.minFollowers) : 1;
  const viewsRatio = campaign.minAverageViews > 0 ? Math.min(1, views / campaign.minAverageViews) : 1;
  const countryBonus = !campaign.targetCountry || campaign.targetCountry === creator.country ? 1 : 0.5;
  const audienceCompatibility = WEIGHTS.audienceCompatibility * Math.min(followersRatio, viewsRatio) * countryBonus;

  const compensationCompatibility = compensationCompatible(creator, campaign.compensationType) ? WEIGHTS.compensationCompatibility : 0;

  // New creators with no completed campaigns get a neutral (not punitive) baseline.
  const historicalPerformance = creator.campaignsCompleted > 0 ? WEIGHTS.historicalPerformance * (creator.avgRating / 5) : WEIGHTS.historicalPerformance * 0.5;

  const reliability = WEIGHTS.reliability * (creator.reliabilityScore / 100) * (1 - creator.disputeRate);

  const availability = campaign.deliveryDays > 0
    ? WEIGHTS.availability * Math.min(1, campaign.deliveryDays / Math.max(1, creator.turnaroundDays))
    : WEIGHTS.availability;

  const total = Math.round(
    categoryAffinity + marketplaceCompatibility + audienceCompatibility + compensationCompatibility + historicalPerformance + reliability + availability,
  );

  return {
    categoryAffinity: Math.round(categoryAffinity),
    marketplaceCompatibility: Math.round(marketplaceCompatibility),
    audienceCompatibility: Math.round(audienceCompatibility),
    compensationCompatibility: Math.round(compensationCompatibility),
    historicalPerformance: Math.round(historicalPerformance),
    reliability: Math.round(reliability),
    availability: Math.round(availability),
    total: Math.min(100, Math.max(0, total)),
  };
}
