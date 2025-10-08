import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Plan Zajęć PK - Kiedy Mam Zajęcia | Rozkład Zajęć Politechnika Krakowska",
  description: "Portal planu zajęć Politechniki Krakowskiej - sprawdź kiedy mam zajęcia, harmonogram i rozkład zajęć dla wszystkich kierunków. Kalendarz, powiadomienia, mapa kampusu i więcej.",
  keywords: ["plan zajęć pk", "politechnika krakowska", "kiedy mam zajęcia", "rozkład zajęć", "harmonogram zajęć pk", "plan studiów informatyka", "kalendarz zajęć pk"],
  authors: [{ name: "Plan PK" }],
  creator: "Plan PK",
  publisher: "Politechnika Krakowska",
  metadataBase: new URL('https://plan.pk.edu.pl'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: 'https://plan.pk.edu.pl',
    title: 'Plan Zajęć PK - Kiedy Mam Zajęcia | Rozkład Zajęć Politechnika Krakowska',
    description: 'Portal planu zajęć Politechniki Krakowskiej - sprawdź kiedy mam zajęcia, harmonogram i rozkład zajęć dla wszystkich kierunków. Kalendarz, powiadomienia, mapa kampusu.',
    siteName: 'Plan Zajęć PK',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Plan Zajęć Politechnika Krakowska',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plan Zajęć PK - Kiedy Mam Zajęcia',
    description: 'Portal planu zajęć Politechniki Krakowskiej - harmonogram, kalendarz, powiadomienia',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // TODO: Replace with actual verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://plan.pk.edu.pl/#webapp',
        name: 'Plan Zajęć PK',
        url: 'https://plan.pk.edu.pl',
        description: 'Portal planu zajęć Politechniki Krakowskiej - sprawdź kiedy mam zajęcia, harmonogram i rozkład zajęć dla wszystkich kierunków.',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'PLN',
        },
        creator: {
          '@type': 'Organization',
          '@id': 'https://plan.pk.edu.pl/#organization',
          name: 'Politechnika Krakowska',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://plan.pk.edu.pl/#organization',
        name: 'Politechnika Krakowska',
        url: 'https://www.pk.edu.pl',
        logo: 'https://plan.pk.edu.pl/images/logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://plan.pk.edu.pl/#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Strona główna',
            item: 'https://plan.pk.edu.pl',
          },
        ],
      },
    ],
  };

  return (
    <html lang="pl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#083575" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Plan PK" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <SessionProvider>
          {children}
          <Toaster position="top-right" />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
