import { ForbiddenException } from '@nestjs/common';
import { assertValidTransition } from './collaboration-state-machine';

describe('collaboration state machine', () => {
  it('rejects skipping straight from SAMPLE_PENDING to COMPLETED', () => {
    expect(() => assertValidTransition('SAMPLE_PENDING', 'COMPLETED', 'BRAND')).toThrow(ForbiddenException);
  });

  it('rejects skipping straight from ACCEPTED to COMPLETED', () => {
    expect(() => assertValidTransition('ACCEPTED', 'COMPLETED', 'BRAND')).toThrow(ForbiddenException);
  });

  it('allows the brand to move ACCEPTED -> SAMPLE_PENDING', () => {
    expect(() => assertValidTransition('ACCEPTED', 'SAMPLE_PENDING', 'BRAND')).not.toThrow();
  });

  it('rejects the creator moving ACCEPTED -> SAMPLE_PENDING (brand-only step)', () => {
    expect(() => assertValidTransition('ACCEPTED', 'SAMPLE_PENDING', 'CREATOR')).toThrow(ForbiddenException);
  });

  it('allows the creator to skip the sample flow straight to CONTENT_IN_PROGRESS', () => {
    expect(() => assertValidTransition('ACCEPTED', 'CONTENT_IN_PROGRESS', 'CREATOR')).not.toThrow();
  });

  it('rejects any transition out of a terminal state', () => {
    expect(() => assertValidTransition('COMPLETED', 'CANCELLED', 'BRAND')).toThrow(ForbiddenException);
    expect(() => assertValidTransition('CANCELLED', 'ACCEPTED', 'CREATOR')).toThrow(ForbiddenException);
  });

  it('rejects changing state directly out of DISPUTED (must go through dispute resolution)', () => {
    expect(() => assertValidTransition('DISPUTED', 'COMPLETED', 'BRAND')).toThrow(ForbiddenException);
  });

  it('allows either party to cancel from most non-terminal states', () => {
    expect(() => assertValidTransition('CONTENT_IN_PROGRESS', 'CANCELLED', 'CREATOR')).not.toThrow();
    expect(() => assertValidTransition('DRAFT_SUBMITTED', 'CANCELLED', 'BRAND')).not.toThrow();
  });

  it('walks the full happy path with the correct acting party at each step', () => {
    const steps: Array<[Parameters<typeof assertValidTransition>[0], Parameters<typeof assertValidTransition>[1], Parameters<typeof assertValidTransition>[2]]> = [
      ['ACCEPTED', 'SAMPLE_PENDING', 'BRAND'],
      ['SAMPLE_PENDING', 'SAMPLE_SENT', 'BRAND'],
      ['SAMPLE_SENT', 'SAMPLE_RECEIVED', 'CREATOR'],
      ['SAMPLE_RECEIVED', 'CONTENT_IN_PROGRESS', 'CREATOR'],
      ['CONTENT_IN_PROGRESS', 'DRAFT_SUBMITTED', 'CREATOR'],
      ['DRAFT_SUBMITTED', 'FINAL_SUBMITTED', 'CREATOR'],
      ['FINAL_SUBMITTED', 'APPROVED', 'BRAND'],
      ['APPROVED', 'PUBLISHED', 'CREATOR'],
      ['PUBLISHED', 'COMPLETED', 'BRAND'],
    ];
    for (const [from, to, party] of steps) {
      expect(() => assertValidTransition(from, to, party)).not.toThrow();
    }
  });
});
