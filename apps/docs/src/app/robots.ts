import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    host: 'https://docs.aplyio.com',
    sitemap: 'https://docs.aplyio.com/sitemap.xml',
  };
}
