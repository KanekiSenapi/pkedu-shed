"use client";

import { ScheduleEntry } from '@/types/schedule';
import { useMemo } from 'react';

interface SubjectProgressProps {
  entries: ScheduleEntry[];
}

interface SubjectProgressStats {
  subject: string;
  total: number;
  completed: number;
  upcoming: number;
  completedLectures: number;
  completedLabs: number;
  completedProjects: number;
  completedExercises: number;
  upcomingLectures: number;
  upcomingLabs: number;
  upcomingProjects: number;
  upcomingExercises: number;
  completedRemote: number;
  completedStationary: number;
  upcomingRemote: number;
  upcomingStationary: number;
}

export function SubjectProgress({ entries }: SubjectProgressProps) {
  const subjectStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Format date using local timezone (not UTC)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const subjectMap = new Map<string, SubjectProgressStats>();

    entries.forEach((entry) => {
      const subject = entry.class_info.subject;
      const isPast = entry.date < todayStr;

      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          subject,
          total: 0,
          completed: 0,
          upcoming: 0,
          completedLectures: 0,
          completedLabs: 0,
          completedProjects: 0,
          completedExercises: 0,
          upcomingLectures: 0,
          upcomingLabs: 0,
          upcomingProjects: 0,
          upcomingExercises: 0,
          completedRemote: 0,
          completedStationary: 0,
          upcomingRemote: 0,
          upcomingStationary: 0,
        });
      }

      const stats = subjectMap.get(subject)!;
      stats.total++;

      if (isPast) {
        stats.completed++;
        if (entry.class_info.type === 'wykład') stats.completedLectures++;
        else if (entry.class_info.type === 'laboratorium') stats.completedLabs++;
        else if (entry.class_info.type === 'projekt') stats.completedProjects++;
        else if (entry.class_info.type === 'ćwiczenia') stats.completedExercises++;

        if (entry.class_info.is_remote) stats.completedRemote++;
        else stats.completedStationary++;
      } else {
        stats.upcoming++;
        if (entry.class_info.type === 'wykład') stats.upcomingLectures++;
        else if (entry.class_info.type === 'laboratorium') stats.upcomingLabs++;
        else if (entry.class_info.type === 'projekt') stats.upcomingProjects++;
        else if (entry.class_info.type === 'ćwiczenia') stats.upcomingExercises++;

        if (entry.class_info.is_remote) stats.upcomingRemote++;
        else stats.upcomingStationary++;
      }
    });

    return Array.from(subjectMap.values()).sort((a, b) =>
      a.subject.localeCompare(b.subject, 'pl')
    );
  }, [entries]);

  if (subjectStats.length === 0) {
    return null;
  }

  const calculateProgress = (completed: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
        Statystyki przedmiotów
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-medium text-gray-600">Przedmiot</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Razem</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Za nami</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Przed nami</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Postęp</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Wyk.</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Lab.</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Proj.</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Ćw.</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Zdalne</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Stacj.</th>
            </tr>
          </thead>
          <tbody>
            {subjectStats.map((stat) => {
              const progress = calculateProgress(stat.completed, stat.total);

              return (
                <tr key={stat.subject} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 text-gray-900">{stat.subject}</td>
                  <td className="py-2 px-2 text-center font-medium text-gray-900">{stat.total}</td>
                  <td className="py-2 px-2 text-center text-gray-600">{stat.completed}</td>
                  <td className="py-2 px-2 text-center text-gray-600">{stat.upcoming}</td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 h-2">
                        <div
                          className="bg-blue-600 h-2"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-600 font-medium w-8">{progress}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-gray-600">
                    {stat.completedLectures > 0 || stat.upcomingLectures > 0
                      ? `${stat.completedLectures}/${stat.completedLectures + stat.upcomingLectures}`
                      : '-'}
                  </td>
                  <td className="py-2 px-2 text-center text-gray-600">
                    {stat.completedLabs > 0 || stat.upcomingLabs > 0
                      ? `${stat.completedLabs}/${stat.completedLabs + stat.upcomingLabs}`
                      : '-'}
                  </td>
                  <td className="py-2 px-2 text-center text-gray-600">
                    {stat.completedProjects > 0 || stat.upcomingProjects > 0
                      ? `${stat.completedProjects}/${stat.completedProjects + stat.upcomingProjects}`
                      : '-'}
                  </td>
                  <td className="py-2 px-2 text-center text-gray-600">
                    {stat.completedExercises > 0 || stat.upcomingExercises > 0
                      ? `${stat.completedExercises}/${stat.completedExercises + stat.upcomingExercises}`
                      : '-'}
                  </td>
                  <td className="py-2 px-2 text-center text-blue-600">
                    {stat.completedRemote > 0 || stat.upcomingRemote > 0
                      ? `${stat.completedRemote}/${stat.completedRemote + stat.upcomingRemote}`
                      : '-'}
                  </td>
                  <td className="py-2 px-2 text-center text-green-600">
                    {stat.completedStationary > 0 || stat.upcomingStationary > 0
                      ? `${stat.completedStationary}/${stat.completedStationary + stat.upcomingStationary}`
                      : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
