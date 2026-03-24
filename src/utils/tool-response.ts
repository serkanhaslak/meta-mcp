export function okResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function errResult(message: string) {
  return {
    content: [{ type: 'text' as const, text: message.startsWith('Error:') ? message : `Error: ${message}` }],
    isError: true as const,
  };
}

export function parseJsonParam<T = unknown>(
  value: string,
  paramName: string,
): { ok: true; value: T } | { ok: false; result: ReturnType<typeof errResult> } {
  try {
    return { ok: true, value: JSON.parse(value) as T };
  } catch {
    return { ok: false, result: errResult(`${paramName} must be a valid JSON string.`) };
  }
}

export function toOptionalNumber(value: string | undefined): number | undefined {
  return value !== undefined ? Number(value) : undefined;
}

export function normalizeEffectiveStatus(csv: string): string {
  return JSON.stringify(csv.split(',').map(s => s.trim()));
}
