import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/employer/',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: 'https://joblifyhq.com/sitemap.xml',
    host: 'https://joblifyhq.com',
  };
}
