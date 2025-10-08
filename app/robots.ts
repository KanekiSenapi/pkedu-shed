import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/browse', '/map'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/settings/', '/begin'],
      },
    ],
    sitemap: 'https://plan.pk.edu.pl/sitemap.xml',
  }
}
