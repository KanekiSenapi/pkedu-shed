import { GroupedSubject } from '@/lib/instructor-schedule';

interface SubjectOverviewProps {
  subjects: GroupedSubject[];
}

export function SubjectOverview({ subjects }: SubjectOverviewProps) {
  if (subjects.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
          Prowadzone przedmioty
        </h2>
        <p className="text-gray-500 text-center py-8">
          Brak przypisanych przedmiotów
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
        Prowadzone przedmioty ({subjects.length})
      </h2>

      <div className="space-y-4">
        {subjects.map((subject) => (
          <div
            key={subject.subject}
            className="border border-gray-200 p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {subject.subject}
                </h3>

                <div className="space-y-1 text-sm text-gray-600">
                  {subject.lectureCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-medium">Wykład:</span>
                      <span>{subject.groups.join(', ')}</span>
                    </div>
                  )}

                  {subject.exerciseCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 font-medium">Ćwiczenia:</span>
                      <span>{subject.groups.slice(0, 5).join(', ')}{subject.groups.length > 5 ? '...' : ''}</span>
                    </div>
                  )}

                  {subject.labCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">Lab:</span>
                      <span>{subject.groups.slice(0, 5).join(', ')}{subject.groups.length > 5 ? '...' : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right ml-4">
                <div className="text-sm text-gray-500">Grupy</div>
                <div className="text-2xl font-bold text-gray-900">{subject.groups.length}</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div>
                <span className="font-medium">{subject.entries.length}</span> zajęć w semestrze
              </div>
              <div className="flex gap-3">
                {subject.lectureCount > 0 && (
                  <span className="text-blue-600">{subject.lectureCount} wykł.</span>
                )}
                {subject.exerciseCount > 0 && (
                  <span className="text-purple-600">{subject.exerciseCount} ćw.</span>
                )}
                {subject.labCount > 0 && (
                  <span className="text-green-600">{subject.labCount} lab.</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
