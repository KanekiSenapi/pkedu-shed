import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logowanie - Plan Zajęć PK | Zaloguj się do Portalu',
  description: 'Zaloguj się do portalu Plan Zajęć Politechniki Krakowskiej. Dostęp do powiadomień o zmianach, zapisywania preferencji i śledzenia obecności.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
