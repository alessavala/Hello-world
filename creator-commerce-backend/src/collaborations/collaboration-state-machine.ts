import { ForbiddenException } from '@nestjs/common';
import { CollaborationStatus } from '@prisma/client';

export type CollaborationParty = 'CREATOR' | 'BRAND';

interface TransitionRule {
  from: CollaborationStatus;
  to: CollaborationStatus;
  by: CollaborationParty[];
}

/**
 * Explicit (from, to, allowed-role) transition table for the collaboration
 * lifecycle. Anything not listed here is an illegal jump (e.g.
 * SAMPLE_PENDING -> COMPLETED), and each transition names exactly who may
 * perform it - a party being allowed to move OUT of a state does not imply
 * they may perform every transition out of it.
 *
 * DISPUTED is entered exclusively via the disputes module (opening a
 * dispute) and exited exclusively by an admin resolving it - neither is
 * reachable through this table, which only governs the "happy path" PATCH
 * endpoint. Both parties may cancel a non-terminal collaboration at any
 * point, so CANCELLED is granted from every non-terminal state below.
 */
const TRANSITIONS: TransitionRule[] = [
  { from: 'ACCEPTED', to: 'SAMPLE_PENDING', by: ['BRAND'] },
  { from: 'ACCEPTED', to: 'CONTENT_IN_PROGRESS', by: ['CREATOR'] },
  { from: 'SAMPLE_PENDING', to: 'SAMPLE_SENT', by: ['BRAND'] },
  { from: 'SAMPLE_SENT', to: 'SAMPLE_RECEIVED', by: ['CREATOR'] },
  { from: 'SAMPLE_RECEIVED', to: 'CONTENT_IN_PROGRESS', by: ['CREATOR'] },
  { from: 'CONTENT_IN_PROGRESS', to: 'DRAFT_SUBMITTED', by: ['CREATOR'] },
  { from: 'DRAFT_SUBMITTED', to: 'CHANGES_REQUESTED', by: ['BRAND'] },
  { from: 'DRAFT_SUBMITTED', to: 'FINAL_SUBMITTED', by: ['CREATOR'] },
  { from: 'CHANGES_REQUESTED', to: 'DRAFT_SUBMITTED', by: ['CREATOR'] },
  { from: 'FINAL_SUBMITTED', to: 'APPROVED', by: ['BRAND'] },
  { from: 'FINAL_SUBMITTED', to: 'CHANGES_REQUESTED', by: ['BRAND'] },
  { from: 'APPROVED', to: 'PUBLISHED', by: ['CREATOR'] },
  { from: 'PUBLISHED', to: 'COMPLETED', by: ['BRAND'] },
];

const TERMINAL: CollaborationStatus[] = ['COMPLETED', 'CANCELLED'];
const CANCELLABLE_FROM: CollaborationStatus[] = [
  'ACCEPTED',
  'SAMPLE_PENDING',
  'SAMPLE_SENT',
  'SAMPLE_RECEIVED',
  'CONTENT_IN_PROGRESS',
  'DRAFT_SUBMITTED',
  'CHANGES_REQUESTED',
  'FINAL_SUBMITTED',
  'APPROVED',
];

export function assertValidTransition(from: CollaborationStatus, to: CollaborationStatus, actingAs: CollaborationParty) {
  if (TERMINAL.includes(from)) {
    throw new ForbiddenException(`Collaboration is already ${from} and cannot change state`);
  }
  if (from === 'DISPUTED') {
    throw new ForbiddenException('Collaboration is under dispute; resolve the dispute before changing state');
  }

  if (to === 'CANCELLED') {
    if (!CANCELLABLE_FROM.includes(from)) {
      throw new ForbiddenException(`Cannot cancel a collaboration from ${from}`);
    }
    return;
  }

  const rule = TRANSITIONS.find((r) => r.from === from && r.to === to);
  if (!rule) {
    const allowed = TRANSITIONS.filter((r) => r.from === from).map((r) => r.to);
    throw new ForbiddenException(`Cannot move collaboration from ${from} to ${to}. Allowed: ${allowed.length ? allowed.join(', ') : 'none'}`);
  }
  if (!rule.by.includes(actingAs)) {
    throw new ForbiddenException(`Only the ${rule.by.join(' or ')} party can move a collaboration from ${from} to ${to}`);
  }
}
