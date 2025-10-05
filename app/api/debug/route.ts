import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const schedule = await prisma.schedule.findFirst({
    include: {
      sections: {
        include: {
          entries: {
            take: 5,
          },
        },
      },
    },
  });

  const sections = await prisma.scheduleSection.findMany({
    select: {
      kierunek: true,
      stopien: true,
      rok: true,
      semestr: true,
      tryb: true,
      groups: true,
      _count: {
        select: {
          entries: true,
        },
      },
    },
  });

  return NextResponse.json({
    schedule: schedule
      ? {
          fileHash: schedule.fileHash,
          lastUpdated: schedule.lastUpdated,
          sectionsCount: schedule.sections.length,
        }
      : null,
    sections,
    totalEntries: await prisma.scheduleEntry.count(),
  });
}
