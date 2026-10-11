/** روابط لا يجوز أن تكون slug لصالون (تتعارض مع صفحات الموقع) */
export const RESERVED_SLUGS = new Set([
  "api",
  "dashboard",
  "login",
  "logout",
  "signup",
  "faq",
  "terms",
  "privacy",
  "pricing",
  "sandbox",
  "admin",
  "static",
  "assets",
  "favicon",
  "robots",
  "sitemap",
  "mutrafa",
  "dalal",
  "www",
]);

export const SLUG_PATTERN = /^[a-z0-9-]{3,30}$/;

export function isSlugAvailableFormat(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug) && !slug.startsWith("-") && !slug.endsWith("-");
}
