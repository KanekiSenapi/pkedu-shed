import { ParsedSchedule, ScheduleEntry } from '@/types/schedule';

export interface InstructorData {
  id: string;
  full_name: string;
  abbreviations: string[];
}

export interface GroupedSubject {
  subject: string;
  entries: ScheduleEntry[];
  groups: string[];
  totalHours: number;
  lectureCount: number;
  exerciseCount: number;
  labCount: number;
}

export interface InstructorStats {
  uniqueSubjects: number;
  uniqueGroups: number;
  todayCount: number;
  thisWeekCount: number;
  lectureCount: number;
  exerciseCount: number;
  labCount: number;
}

/**
 * Filter schedule entries for an instructor using database aliases
 */
export async function getInstructorSchedule(
  schedule: ParsedSchedule | null,
  instructorId: string
): Promise<ScheduleEntry[]> {
  if (!schedule) return [];

  // Fetch instructor data from database
  let instructorData: InstructorData;
  try {
    const res = await fetch(`/api/admin/instructors/${instructorId}`);
    const data = await res.json();

    if (!data.success || !data.instructor) {
      console.error('Failed to fetch instructor data');
      return [];
    }

    instructorData = {
      id: data.instructor.id,
      full_name: data.instructor.full_name,
      abbreviations: data.instructor.abbreviations || [],
    };
  } catch (error) {
    console.error('Error fetching instructor:', error);
    return [];
  }

  const allEntries = schedule.sections.flatMap(s => s.entries);

  // Filter entries where instructor field matches full name or any alias
  return allEntries.filter(entry => {
    const instructorField = entry.class_info.instructor;
    if (!instructorField) return false;

    // Split by "/" to handle multiple instructors
    const parts = instructorField.split('/').map(p => p.trim());

    return parts.some(part => {
      const partLower = part.toLowerCase();
      const fullNameLower = instructorData.full_name.toLowerCase();

      // Check if matches full name
      if (partLower === fullNameLower) return true;

      // Check if matches any alias
      return instructorData.abbreviations.some(alias =>
        alias.toLowerCase() === partLower
      );
    });
  });
}

/**
 * Fallback method using only full name (for backwards compatibility)
 */
export function getInstructorScheduleByName(
  schedule: ParsedSchedule | null,
  fullName: string
): ScheduleEntry[] {
  if (!schedule) return [];

  const allEntries = schedule.sections.flatMap(s => s.entries);
  const fullNameLower = fullName.toLowerCase();

  return allEntries.filter(entry => {
    const instructorField = entry.class_info.instructor;
    if (!instructorField) return false;

    const parts = instructorField.split('/').map(p => p.trim());
    return parts.some(part => part.toLowerCase() === fullNameLower);
  });
}

/**
 * Group schedule entries by subject
 */
export function groupBySubject(entries: ScheduleEntry[]): GroupedSubject[] {
  const grouped = new Map<string, ScheduleEntry[]>();

  entries.forEach(entry => {
    const subject = entry.class_info.subject;
    if (!grouped.has(subject)) {
      grouped.set(subject, []);
    }
    grouped.get(subject)!.push(entry);
  });

  return Array.from(grouped.entries()).map(([subject, subjectEntries]) => {
    // Get unique groups
    const groups = [...new Set(subjectEntries.map(e => e.group))].sort();

    // Calculate total hours per week
    const hoursPerEntry = 1.5; // Typical class duration
    const totalHours = subjectEntries.length * hoursPerEntry;

    // Count by type
    const lectureCount = subjectEntries.filter(e =>
      e.class_info.type?.toLowerCase().includes('wykład')
    ).length;

    const exerciseCount = subjectEntries.filter(e =>
      e.class_info.type?.toLowerCase().includes('ćwicz')
    ).length;

    const labCount = subjectEntries.filter(e =>
      e.class_info.type?.toLowerCase().includes('lab')
    ).length;

    return {
      subject,
      entries: subjectEntries,
      groups,
      totalHours,
      lectureCount,
      exerciseCount,
      labCount,
    };
  }).sort((a, b) => a.subject.localeCompare(b.subject));
}

/**
 * Calculate statistics for instructor dashboard
 */
export function getInstructorStats(entries: ScheduleEntry[]): InstructorStats {
  const today = new Date().toISOString().split('T')[0];
  const todayClasses = entries.filter(e => e.date === today);

  const thisWeekStart = new Date();
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date();
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

  const thisWeekClasses = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate >= thisWeekStart && entryDate <= thisWeekEnd;
  });

  const uniqueSubjects = new Set(entries.map(e => e.class_info.subject)).size;
  const uniqueGroups = new Set(entries.map(e => e.group)).size;

  const lectureCount = thisWeekClasses.filter(e =>
    e.class_info.type?.toLowerCase().includes('wykład')
  ).length;

  const exerciseCount = thisWeekClasses.filter(e =>
    e.class_info.type?.toLowerCase().includes('ćwicz')
  ).length;

  const labCount = thisWeekClasses.filter(e =>
    e.class_info.type?.toLowerCase().includes('lab')
  ).length;

  return {
    uniqueSubjects,
    uniqueGroups,
    todayCount: todayClasses.length,
    thisWeekCount: thisWeekClasses.length,
    lectureCount,
    exerciseCount,
    labCount,
  };
}

/**
 * Get today's classes for instructor
 */
export function getTodayClasses(entries: ScheduleEntry[]): ScheduleEntry[] {
  const today = new Date().toISOString().split('T')[0];
  return entries
    .filter(e => e.date === today)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * Get upcoming classes (next 7 days)
 */
export function getUpcomingClasses(entries: ScheduleEntry[]): ScheduleEntry[] {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const todayStr = today.toISOString().split('T')[0];
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  return entries
    .filter(e => e.date >= todayStr && e.date <= nextWeekStr)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    })
    .slice(0, 15); // Show next 15 classes
}
