/** Central site metadata — single source for app name, description, nav. */
export const siteConfig = {
  name: 'English AI',
  description:
    'AI-powered English learning platform for beginners through intermediate learners.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const;

export type SiteConfig = typeof siteConfig;
