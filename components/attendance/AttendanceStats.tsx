"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSchedule } from '@/lib/use-schedule';
import { syncLoadUserPreferences } from '@/lib/user-preferences';
import { filterScheduleByPreferences } from '@/lib/user-schedule';

interface AttendanceStats {
  total_classes: number;
  attended: number;
  missed: number;
  attendance_rate: number;
  total_hours: number;
  attended_hours: number;
}

export function AttendanceStats() {
  const { data: session, status } = useSession();
  const { schedule } = useSchedule();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && schedule) {
      fetchStats();
    }

    // Listen for attendance updates
    const handleAttendanceUpdate = () => {
      if (session && schedule) {
        fetchStats();
      }
    };

    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
    };
  }, [session, schedule]);

  const fetchStats = async () => {
    try {
      // Get user preferences to filter schedule
      const prefs = await syncLoadUserPreferences();
      if (!prefs) {
        setLoading(false);
        return;
      }

      // Get filtered schedule entries
      const filteredEntries = filterScheduleByPreferences(schedule, prefs);

      // Get all attendance records
      const response = await fetch('/api/attendance');
      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();
      const attendanceRecords = data.attendance || [];

      // Get all past non-lecture classes (excluding wykłady)
      const now = new Date();
      const pastClasses = filteredEntries.filter(entry => {
        // Check if class is in the past
        const [endTime] = entry.time.split('-').map(t => t.trim()).reverse();
        const classDateTime = new Date(`${entry.date}T${endTime}:00`);
        if (classDateTime > now) return false;

        // Exclude wykłady (lectures)
        return entry.class_info.type?.toLowerCase() !== 'wykład';
      });

      // For each past class, check if there's an attendance record
      let attended = 0;
      for (const classEntry of pastClasses) {
        const record = attendanceRecords.find((r: any) =>
          r.entry_date === classEntry.date &&
          r.entry_time === classEntry.time &&
          r.subject === classEntry.class_info.subject
        );

        // If there's a record and attended is true, count it
        if (record && record.attended) {
          attended++;
        }
        // Otherwise, treat as missed (including when no record exists)
      }

      const total = pastClasses.length;
      const missed = total - attended;
      const attendance_rate = total > 0 ? (attended / total) * 100 : 0;

      setStats({
        total_classes: total,
        attended,
        missed,
        attendance_rate,
        total_hours: 0,
        attended_hours: 0,
      });
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
          Statystyki obecności
        </h2>
        <div className="text-center text-gray-500 py-4">Ładowanie...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
          Statystyki obecności
        </h2>
        <div className="bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-900">
            <strong>Zaloguj się</strong>, aby zobaczyć swoje statystyki obecności.
          </p>
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
          >
            Przejdź do logowania →
          </a>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_classes === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
          Statystyki obecności
        </h2>
        <div className="text-center text-gray-500 py-4">
          Brak danych o obecności. Zaznacz obecność przy zajęciach aby zobaczyć statystyki.
        </div>
      </div>
    );
  }

  const attendanceColor =
    stats.attendance_rate >= 80 ? 'text-green-600' :
    stats.attendance_rate >= 50 ? 'text-yellow-600' :
    'text-red-600';

  const attendanceBgColor =
    stats.attendance_rate >= 80 ? 'bg-green-50 border-green-200' :
    stats.attendance_rate >= 50 ? 'bg-yellow-50 border-yellow-200' :
    'bg-red-50 border-red-200';

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
        Statystyki obecności
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance Rate */}
        <div className={`p-4 border ${attendanceBgColor}`}>
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Frekwencja
          </div>
          <div className={`text-3xl font-bold ${attendanceColor}`}>
            {stats.attendance_rate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.attended} / {stats.total_classes} zajęć
          </div>
        </div>

        {/* Missed Classes */}
        <div className="p-4 border bg-gray-50 border-gray-200">
          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Opuszczone</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.missed}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.missed > 0 ? 'zajęć opuszczonych' : 'świetna robota!'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Postęp obecności</span>
          <span>{stats.attendance_rate.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 h-2">
          <div
            className={`h-2 transition-all duration-500 ${
              stats.attendance_rate >= 80 ? 'bg-green-600' :
              stats.attendance_rate >= 50 ? 'bg-yellow-600' :
              'bg-red-600'
            }`}
            style={{ width: `${stats.attendance_rate}%` }}
          ></div>
        </div>
      </div>

      {/* Warning for low attendance */}
      {stats.attendance_rate < 50 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          ⚠️ Uwaga! Twoja frekwencja jest poniżej 50%. Pamiętaj o regularnej obecności!
        </div>
      )}
    </div>
  );
}
