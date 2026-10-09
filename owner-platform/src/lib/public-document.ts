export function selectPublicFallback<T>(
  variant: string | undefined,
  baseline: T,
  reviewed: T,
): T {
  return variant === "revision" ? reviewed : baseline;
}
