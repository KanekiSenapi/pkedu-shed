"use client";

import { useScheduleStore } from '@/lib/store';

export function SubjectStatsTable() {
  const { getSubjectStats } = useScheduleStore();
  const subjectStats = getSubjectStats();

  if (subjectStats.length === 0) {
    return null;
  }

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
              <th className="text-center py-2 px-2 font-medium text-gray-600">Wyk.</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Lab.</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Proj.</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Ćw.</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Zdalne</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Stacj.</th>
            </tr>
          </thead>
          <tbody>
            {subjectStats.map((stat) => (
              <tr key={stat.subject} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2 text-gray-900">{stat.subject}</td>
                <td className="py-2 px-2 text-center font-medium text-gray-900">{stat.total}</td>
                <td className="py-2 px-2 text-center text-gray-600">{stat.lectures || '-'}</td>
                <td className="py-2 px-2 text-center text-gray-600">{stat.labs || '-'}</td>
                <td className="py-2 px-2 text-center text-gray-600">{stat.projects || '-'}</td>
                <td className="py-2 px-2 text-center text-gray-600">{stat.exercises || '-'}</td>
                <td className="py-2 px-2 text-center text-blue-600 font-medium">{stat.remote || '-'}</td>
                <td className="py-2 px-2 text-center text-green-600 font-medium">{stat.stationary || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
