// Each test gets a unique email so the shared e2e DB stays predictable without per-test reset.
export function uniqueEmail(prefix = 'e2e'): string {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${suffix}@test.local`;
}
