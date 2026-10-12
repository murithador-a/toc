/**
 * Where each content section is edited visually.
 *
 * Used by quick find and by the dashboard's health checks so a problem can always
 * link straight to the page it lives on.
 */
export const PAGE_FOR_SECTION: Record<string, string> = {
  home: 'home',
  about: 'about',
  services: 'services',
  process: 'services',
  projects: 'projects',
  reviews: 'home',
  faqs: 'home',
  cta: 'home',
  contact: 'contact',
  consultation: 'consultation',
  privacy: 'privacy',
  company: 'contact',
  forms: 'contact',
  footer: 'home',
  menu: 'home',
  seo: 'home',
  meta: 'home',
}

export const visualLink = (section: string, field?: string): string => {
  const page = PAGE_FOR_SECTION[section] ?? 'home'
  const base = '/admin/visual/' + page + '?section=' + section
  return field ? base + '&field=' + encodeURIComponent(field) : base
}
