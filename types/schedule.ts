// Core types for schedule data

export type ClassType = 'wykład' | 'laboratorium' | 'projekt' | 'ćwiczenia' | null;

export type StudyMode = 'stacjonarne' | 'niestacjonarne';

export type DayOfWeek = 'poniedziałek' | 'wtorek' | 'środa' | 'czwartek' | 'piątek' | 'sobota' | 'niedziela';

export interface ClassInfo {
  subject: string;           // "Sieci neuronowe i deep learning"
  type: ClassType;           // "wykład" | "laboratorium" | "projekt" | "ćwiczenia"
  instructor: string | null; // "dr hab. inż. Maciej Jaworski, prof. PK"
  room: string | null;       // "sala 151" or null if remote
  is_remote: boolean;        // true if "ZDALNIE"
  raw: string;               // original cell text
  overrideTime?: { start: string; end: string }; // optional time override (e.g., "13:45-16:15")
  note?: string;             // additional info/note after room (e.g., "Zajęcia dla studentów powtarzających przedmiot.")
}

export interface ScheduleEntry {
  id: string;                // unique identifier
  date: string;              // "2025-10-04" (ISO format)
  day: DayOfWeek;            // "sobota"
  time: string;              // "8:00-10:30"
  start_time: string;        // "08:00"
  end_time: string;          // "10:30"
  group: string;             // "DS1", "DS2", etc.
  class_info: ClassInfo;

  // Additional metadata
  kierunek: string;          // "Informatyka"
  stopien: string;           // "I" or "II"
  rok: number;               // 1, 2, 3, 4
  semestr: number;           // 1-8
  tryb: StudyMode;           // "stacjonarne" | "niestacjonarne"
}

export interface ScheduleSection {
  kierunek: string;
  stopien: string;
  rok: number;
  semestr: number;
  tryb: StudyMode;
  groups: string[];          // ["DS1", "DS2"]
  entries: ScheduleEntry[];
}

export interface ParsedSchedule {
  sections: ScheduleSection[];
  lastUpdated: string;       // ISO timestamp
  fileHash: string;          // MD5 hash of source file
  fileName?: string;         // Original filename from source
}

export interface FilterOptions {
  kierunek?: string;
  stopien?: string;
  rok?: number;
  semestr?: number;
  tryb?: StudyMode;
  groups?: string[];
  subject?: string;
}

export interface ScheduleStats {
  totalClasses: number;
  remoteClasses: number;
  stationaryClasses: number;
  totalWeekends: number;
  byType: {
    wykład: number;
    laboratorium: number;
    projekt: number;
    ćwiczenia: number;
    other: number;
  };
}

export interface CacheData {
  schedule: ParsedSchedule;
  timestamp: string;
}
