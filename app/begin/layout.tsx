import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rozpocznij - Plan Zajęć PK | Konfiguracja Portalu',
  description: 'Skonfiguruj swój plan zajęć Politechniki Krakowskiej. Wybierz kierunek, rok i grupę aby dostosować harmonogram do swoich potrzeb.',
  alternates: {
    canonical: '/begin',
  },
};

export default function BeginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
