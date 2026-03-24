import type { MetaApiResponse } from '../types.js';

export function getNextCursor(response: MetaApiResponse): string | undefined {
  if (response.paging?.cursors?.after) {
    return response.paging.cursors.after;
  }
  // Fallback: extract cursor from the next URL for endpoints that don't populate cursors
  if (response.paging?.next) {
    try {
      return new URL(response.paging.next).searchParams.get('after') ?? undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
