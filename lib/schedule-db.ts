import { prisma } from './prisma';
import { ParsedSchedule, ScheduleSection as ScheduleSectionType } from '@/types/schedule';

/**
 * Saves parsed schedule to database
 */
export async function saveScheduleToDB(schedule: ParsedSchedule): Promise<void> {
  // Check if schedule with this hash already exists
  const existing = await prisma.schedule.findUnique({
    where: { fileHash: schedule.fileHash },
  });

  if (existing) {
    console.log('Schedule with this hash already exists');
    return;
  }

  // Delete old schedules (keep only latest)
  await prisma.schedule.deleteMany();

  // Create new schedule with sections and entries
  await prisma.schedule.create({
    data: {
      fileHash: schedule.fileHash,
      lastUpdated: new Date(schedule.lastUpdated),
      sections: {
        create: schedule.sections.map((section) => ({
          kierunek: section.kierunek,
          stopien: section.stopien,
          rok: section.rok,
          semestr: section.semestr,
          tryb: section.tryb,
          groups: JSON.stringify(section.groups),
          entries: {
            create: section.entries.map((entry) => ({
              date: entry.date,
              day: entry.day,
              time: entry.time,
              startTime: entry.start_time,
              endTime: entry.end_time,
              group: entry.group,
              subject: entry.class_info.subject,
              type: entry.class_info.type,
              instructor: entry.class_info.instructor,
              room: entry.class_info.room,
              isRemote: entry.class_info.is_remote,
              rawContent: entry.class_info.raw,
            })),
          },
        })),
      },
    },
  });

  console.log('Schedule saved to database successfully');
}

/**
 * Loads schedule from database
 */
export async function loadScheduleFromDB(): Promise<ParsedSchedule | null> {
  const schedule = await prisma.schedule.findFirst({
    include: {
      sections: {
        include: {
          entries: true,
        },
      },
    },
    orderBy: {
      lastUpdated: 'desc',
    },
  });

  if (!schedule) {
    return null;
  }

  // Convert database format back to ParsedSchedule format
  const sections: ScheduleSectionType[] = schedule.sections.map((section) => ({
    kierunek: section.kierunek,
    stopien: section.stopien,
    rok: section.rok,
    semestr: section.semestr,
    tryb: section.tryb as 'stacjonarne' | 'niestacjonarne',
    groups: JSON.parse(section.groups),
    entries: section.entries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      day: entry.day as any,
      time: entry.time,
      start_time: entry.startTime,
      end_time: entry.endTime,
      group: entry.group,
      class_info: {
        subject: entry.subject,
        type: entry.type as any,
        instructor: entry.instructor,
        room: entry.room,
        is_remote: entry.isRemote,
        raw: entry.rawContent,
      },
      kierunek: section.kierunek,
      stopien: section.stopien,
      rok: section.rok,
      semestr: section.semestr,
      tryb: section.tryb as 'stacjonarne' | 'niestacjonarne',
    })),
  }));

  return {
    sections,
    lastUpdated: schedule.lastUpdated.toISOString(),
    fileHash: schedule.fileHash,
  };
}

/**
 * Gets the latest schedule hash from database
 */
export async function getLatestScheduleHash(): Promise<string | null> {
  const schedule = await prisma.schedule.findFirst({
    orderBy: {
      lastUpdated: 'desc',
    },
    select: {
      fileHash: true,
    },
  });

  return schedule?.fileHash || null;
}

/**
 * Checks if schedule exists for a given hash
 */
export async function scheduleExistsForHash(hash: string): Promise<boolean> {
  const count = await prisma.schedule.count({
    where: {
      fileHash: hash,
    },
  });

  return count > 0;
}
