import { ForbiddenException } from '@nestjs/common';
import { assertValidCampaignTransition } from './campaign-state-machine';

describe('campaign state machine', () => {
  it('allows DRAFT -> PUBLISHED', () => {
    expect(() => assertValidCampaignTransition('DRAFT', 'PUBLISHED')).not.toThrow();
  });

  it('allows PUBLISHED -> PAUSED and back to PUBLISHED', () => {
    expect(() => assertValidCampaignTransition('PUBLISHED', 'PAUSED')).not.toThrow();
    expect(() => assertValidCampaignTransition('PAUSED', 'PUBLISHED')).not.toThrow();
  });

  it('rejects reopening a CLOSED campaign', () => {
    expect(() => assertValidCampaignTransition('CLOSED', 'PUBLISHED')).toThrow(ForbiddenException);
  });

  it('rejects reopening a CANCELLED campaign', () => {
    expect(() => assertValidCampaignTransition('CANCELLED', 'DRAFT')).toThrow(ForbiddenException);
  });

  it('rejects skipping DRAFT straight to CLOSED', () => {
    expect(() => assertValidCampaignTransition('DRAFT', 'CLOSED')).toThrow(ForbiddenException);
  });
});
