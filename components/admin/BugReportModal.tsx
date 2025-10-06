"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface BugReport {
  id: number;
  type: string;
  title: string;
  description: string;
  url: string | null;
  user_info: string | null;
  contact_email: string | null;
  user_agent: string | null;
  status: string;
  created_at: string;
}

interface Note {
  id: number;
  report_id: number;
  admin_id: string;
  admin_email: string;
  admin_name: string | null;
  note: string;
  created_at: string;
}

interface BugReportModalProps {
  reportId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function BugReportModal({ reportId, isOpen, onClose, onUpdate }: BugReportModalProps) {
  const [report, setReport] = useState<BugReport | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    if (isOpen && reportId) {
      loadReport();
    }
  }, [isOpen, reportId]);

  const loadReport = async () => {
    if (!reportId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/bug-reports/${reportId}`);
      const data = await response.json();

      if (data.success) {
        setReport(data.report);
        setNotes(data.notes || []);
      } else {
        toast.error(data.error || 'Błąd podczas pobierania zgłoszenia');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Błąd podczas pobierania zgłoszenia');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (newStatus: string) => {
    if (!reportId) return;

    setChangingStatus(true);
    try {
      const response = await fetch(`/api/admin/bug-reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Status zaktualizowany');
        setReport(prev => prev ? { ...prev, status: newStatus } : null);
        onUpdate();
      } else {
        toast.error(data.error || 'Błąd podczas zmiany statusu');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Błąd podczas zmiany statusu');
    } finally {
      setChangingStatus(false);
    }
  };

  const addNote = async () => {
    if (!reportId || !newNote.trim()) return;

    setSavingNote(true);
    try {
      const response = await fetch(`/api/admin/bug-reports/${reportId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Notatka dodana');
        setNewNote('');
        loadReport(); // Reload to get new note
      } else {
        toast.error(data.error || 'Błąd podczas dodawania notatki');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Błąd podczas dodawania notatki');
    } finally {
      setSavingNote(false);
    }
  };

  if (!isOpen) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug': return 'Błąd';
      case 'feature': return 'Sugestia';
      default: return 'Inne';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Otwarte';
      case 'in_progress': return 'W trakcie';
      case 'resolved': return 'Rozwiązane';
      case 'closed': return 'Zamknięte';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pl-PL');
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Ładowanie...</div>
          </div>
        ) : report ? (
          <>
            {/* Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 border border-gray-200">
                      #{report.id}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200">
                      {getTypeLabel(report.type)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 border ${getStatusColor(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{report.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(report.created_at)}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
                >
                  ×
                </button>
              </div>

              {/* Status changer */}
              <div className="flex gap-2">
                {['open', 'in_progress', 'resolved', 'closed'].map(status => (
                  <button
                    key={status}
                    onClick={() => changeStatus(status)}
                    disabled={changingStatus || report.status === status}
                    className={`px-3 py-1 text-xs border transition-colors ${
                      report.status === status
                        ? getStatusColor(status)
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                  Opis
                </h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{report.description}</p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.url && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                      URL
                    </h3>
                    <a
                      href={report.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 break-all"
                    >
                      {report.url}
                    </a>
                  </div>
                )}

                {report.contact_email && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                      Kontakt
                    </h3>
                    <p className="text-sm text-gray-900">{report.contact_email}</p>
                  </div>
                )}

                {report.user_info && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                      Użytkownik
                    </h3>
                    <p className="text-sm text-gray-900">{report.user_info}</p>
                  </div>
                )}

                {report.user_agent && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                      User Agent
                    </h3>
                    <p className="text-xs text-gray-600 font-mono break-all">{report.user_agent}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
                  Notatki ({notes.length})
                </h3>

                {/* Add note */}
                <div className="mb-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Dodaj notatkę..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={addNote}
                    disabled={savingNote || !newNote.trim()}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingNote ? 'Dodawanie...' : 'Dodaj notatkę'}
                  </button>
                </div>

                {/* Notes list */}
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="border border-gray-200 p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium text-gray-900">
                            {note.admin_name || note.admin_email}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(note.created_at)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.note}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Brak notatek</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-600">
            Nie znaleziono zgłoszenia
          </div>
        )}
      </div>
    </div>
  );
}
