import { Campaign } from '@prisma/client';
import { computeMatchScore, MatchableCreator } from './matching';

function baseCreator(overrides: Partial<MatchableCreator> = {}): MatchableCreator {
  return {
    id: 'creator-1',
    userId: 'user-1',
    displayName: 'Test Creator',
    bio: null,
    country: 'MX',
    city: null,
    profilePhotoUrl: null,
    baseRate: null,
    turnaroundDays: 14,
    acceptsProduct: true,
    acceptsFixedFee: true,
    acceptsCommission: true,
    verificationLevel: 'REGISTERED',
    reliabilityScore: 50,
    campaignsCompleted: 0,
    onTimeDeliveryRate: 0,
    firstApprovalRate: 0,
    disputeRate: 0,
    brandRehireRate: 0,
    avgRating: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    socialAccounts: [],
    marketplaces: [],
    categories: [],
    ...overrides,
  } as MatchableCreator;
}

function baseCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'campaign-1',
    brandId: 'brand-1',
    productId: null,
    categoryId: 'category-1',
    name: 'Test Campaign',
    description: 'desc',
    marketplace: 'TIKTOK_SHOP',
    compensationType: 'PRODUCT_ONLY',
    fixedAmount: null,
    creatorsRequired: 1,
    deliverableDescription: 'video',
    applicationDeadline: null,
    deliveryDays: 14,
    minFollowers: 1000,
    minAverageViews: 500,
    targetCountry: null,
    status: 'PUBLISHED',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Campaign;
}

describe('computeMatchScore', () => {
  it('scores a perfectly matched, proven creator near the top of the scale', () => {
    const creator = baseCreator({
      categories: [{ creatorId: 'creator-1', categoryId: 'category-1', createdAt: new Date() }],
      marketplaces: [{ id: 'm1', creatorId: 'creator-1', marketplace: 'TIKTOK_SHOP', profileUrl: null, verified: true, evidenceUrl: null, createdAt: new Date(), updatedAt: new Date() }],
      socialAccounts: [{ id: 's1', creatorId: 'creator-1', platform: 'TIKTOK', username: 'x', profileUrl: 'https://x', followers: 10000, averageViews: 5000, engagementRate: 0.1, verifiedAt: null, createdAt: new Date(), updatedAt: new Date() }],
      campaignsCompleted: 20,
      avgRating: 5,
      reliabilityScore: 100,
      disputeRate: 0,
      turnaroundDays: 5,
    });
    const campaign = baseCampaign({ deliveryDays: 14 });

    const result = computeMatchScore(creator, campaign);
    expect(result.total).toBeGreaterThanOrEqual(95);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('scores an unrelated, unproven creator much lower', () => {
    const creator = baseCreator({ acceptsProduct: false, acceptsFixedFee: false, acceptsCommission: false });
    const campaign = baseCampaign();

    const result = computeMatchScore(creator, campaign);
    expect(result.categoryAffinity).toBe(0);
    expect(result.marketplaceCompatibility).toBe(0);
    expect(result.compensationCompatibility).toBe(0);
    expect(result.total).toBeLessThan(40);
  });

  it('never exceeds 100 or drops below 0', () => {
    const creator = baseCreator({ reliabilityScore: 500, campaignsCompleted: 1, avgRating: 5 } as Partial<MatchableCreator>);
    const campaign = baseCampaign();
    const result = computeMatchScore(creator, campaign);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('does not penalize a brand-new creator with no completed campaigns as harshly as a creator with a bad history', () => {
    const newCreator = baseCreator({ campaignsCompleted: 0 });
    const badHistoryCreator = baseCreator({ campaignsCompleted: 10, avgRating: 1 });
    const campaign = baseCampaign();

    const newScore = computeMatchScore(newCreator, campaign).historicalPerformance;
    const badScore = computeMatchScore(badHistoryCreator, campaign).historicalPerformance;
    expect(newScore).toBeGreaterThan(badScore);
  });
});
