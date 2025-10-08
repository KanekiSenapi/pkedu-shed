import { InstructorStats as StatsType } from '@/lib/instructor-schedule';

interface InstructorStatsProps {
  stats: StatsType;
}

export function InstructorStats({ stats }: InstructorStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Przedmioty</div>
        <div className="text-3xl font-bold text-blue-600">{stats.uniqueSubjects}</div>
        <div className="text-xs text-gray-500 mt-1">prowadzonych</div>
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Grupy</div>
        <div className="text-3xl font-bold text-purple-600">{stats.uniqueGroups}</div>
        <div className="text-xs text-gray-500 mt-1">w sumie</div>
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Dziś</div>
        <div className="text-3xl font-bold text-green-600">{stats.todayCount}</div>
        <div className="text-xs text-gray-500 mt-1">zajęć</div>
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-1">Ten tydzień</div>
        <div className="text-3xl font-bold text-gray-900">{stats.thisWeekCount}</div>
        <div className="text-xs text-gray-500 mt-1">zajęć</div>
      </div>

      {/* Type breakdown */}
      <div className="md:col-span-4 bg-white border border-gray-200 p-6">
        <div className="text-sm text-gray-600 mb-3">Podział zajęć w tym tygodniu</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.lectureCount}</div>
            <div className="text-xs text-gray-500">Wykłady</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.exerciseCount}</div>
            <div className="text-xs text-gray-500">Ćwiczenia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.labCount}</div>
            <div className="text-xs text-gray-500">Laboratoria</div>
          </div>
        </div>
      </div>
    </div>
  );
}
