import { DeckKind } from '../types';

const dismissedThisSession = new Set<DeckKind>();

export function isTapHintVisible(deck: DeckKind) {
  return !dismissedThisSession.has(deck);
}

export function dismissTapHint(deck: DeckKind) {
  dismissedThisSession.add(deck);
}
