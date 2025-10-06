"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface ScheduleChange {
  id: string;
  old_schedule_id: string | null;
  new_schedule_id: string;
  change_type: string;
  entry_id: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  date: string | null;
  group: string | null;
  subject: string | null;
  created_at: string;
}

export function ScheduleChangesViewer() {
  const [changes, setChanges] = useState<ScheduleChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadChanges();
  }, []);

  const loadChanges = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/schedule-changes');
      const data = await response.json();

      if (data.success) {
        setChanges(data.changes || []);
      } else {
        toast.error(data.error || 'Błąd podczas pobierania zmian');
      }
    } catch (error) {
      console.error('Error loading schedule changes:', error);
      toast.error('Błąd podczas pobierania zmian');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pl-PL');
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'added': return 'Dodano';
      case 'removed': return 'Usunięto';
      case 'modified': return 'Zmodyfikowano';
      default: return type;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'added': return 'bg-green-100 text-green-800';
      case 'removed': return 'bg-red-100 text-red-800';
      case 'modified': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredChanges = typeFilter === 'all'
    ? changes
    : changes.filter(c => c.change_type === typeFilter);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-600">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200">
      {/* Header with filters */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Historia zmian w planie</h3>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
        >
          <option value="all">Wszystkie zmiany</option>
          <option value="added">Dodane zajęcia</option>
          <option value="removed">Usunięte zajęcia</option>
          <option value="modified">Zmodyfikowane zajęcia</option>
        </select>
      </div>

      {/* Changes table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Typ zmiany
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Data zajęć
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Przedmiot
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Grupa
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pole
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Zmiana
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Data zmiany
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredChanges.map(change => (
              <tr key={change.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 text-xs font-medium ${getChangeTypeColor(change.change_type)}`}>
                    {getChangeTypeLabel(change.change_type)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {change.date || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {change.subject || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {change.group || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {change.field_name || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {change.change_type === 'modified' ? (
                    <div className="space-y-1">
                      <div className="text-xs text-red-600">
                        <span className="font-medium">Stara:</span> {change.old_value || '-'}
                      </div>
                      <div className="text-xs text-green-600">
                        <span className="font-medium">Nowa:</span> {change.new_value || '-'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {change.new_value || change.old_value || '-'}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDate(change.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredChanges.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {typeFilter === 'all' ? 'Brak zmian w historii' : 'Brak zmian tego typu'}
        </div>
      )}
    </div>
  );
}
