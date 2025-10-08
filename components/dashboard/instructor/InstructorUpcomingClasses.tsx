import { ScheduleEntry } from '@/types/schedule';

interface InstructorUpcomingClassesProps {
  classes: ScheduleEntry[];
}

export function InstructorUpcomingClasses({ classes }: InstructorUpcomingClassesProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = dateStr.split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateOnly === todayStr) return 'Dziś';
    if (dateOnly === tomorrowStr) return 'Jutro';

    const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    return `${days[date.getDay()]}, ${date.getDate()}.${date.getMonth() + 1}`;
  };

  if (classes.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
          Nadchodzące zajęcia
        </h2>
        <p className="text-gray-500 text-center py-8">
          Brak nadchodzących zajęć w najbliższym tygodniu
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
        Nadchodzące zajęcia ({classes.length})
      </h2>

      <div className="space-y-3">
        {classes.map((entry) => {
          const isToday = entry.date === new Date().toISOString().split('T')[0];

          return (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-4 border transition-colors ${
                isToday
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="text-center min-w-[80px]">
                  <div className="text-xs text-gray-600">{formatDate(entry.date)}</div>
                  <div className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {entry.start_time}
                  </div>
                </div>

                <div className="w-px h-12 bg-gray-300"></div>

                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {entry.class_info.subject}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-medium">{entry.class_info.type}</span>
                    <span>•</span>
                    <span>Grupa: {entry.group}</span>
                    {entry.class_info.room && (
                      <>
                        <span>•</span>
                        <span>Sala: {entry.class_info.room}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                {entry.start_time} - {entry.end_time}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
