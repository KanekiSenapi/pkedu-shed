import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mój Plan - Dashboard | Plan Zajęć PK',
  description: 'Twój osobisty dashboard z planem zajęć, powiadomieniami i statystykami.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
