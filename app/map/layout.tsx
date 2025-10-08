import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mapa Kampusu PK - Plan Zajęć | Politechnika Krakowska',
  description: 'Interaktywna mapa kampusu Politechniki Krakowskiej. Znajdź sale wykładowe, budynki i nawiguj do miejsca zajęć. Idealny przewodnik po kampusie PK.',
  alternates: {
    canonical: '/map',
  },
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
