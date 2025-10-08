import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Przeglądaj Rozkład Zajęć - Plan PK | Harmonogram Politechnika Krakowska',
  description: 'Przeglądaj pełny harmonogram zajęć dla wszystkich kierunków Politechniki Krakowskiej. Kalendarz zajęć, filtry, statystyki i mapa kampusu bez konieczności logowania.',
  alternates: {
    canonical: '/browse',
  },
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
