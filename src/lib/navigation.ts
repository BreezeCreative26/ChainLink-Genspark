/**
 * Accept only local app paths for post-auth redirects. This prevents a crafted
 * ?redirect= value from turning login or signup into an open redirect.
 */
export function safeRedirectPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
