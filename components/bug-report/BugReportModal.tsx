"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userInfo?: string;
}

export function BugReportModal({ isOpen, onClose, userInfo }: BugReportModalProps) {
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('Wypełnij wymagane pola');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          url: window.location.href,
          userInfo,
          contactEmail: contactEmail.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Zgłoszenie zostało wysłane');
        setTitle('');
        setDescription('');
        setContactEmail('');
        setType('bug');
        onClose();
      } else {
        toast.error(data.error || 'Błąd podczas wysyłania zgłoszenia');
      }
    } catch (error) {
      console.error('Bug report error:', error);
      toast.error('Nie udało się wysłać zgłoszenia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 shadow-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-gray-900">Zgłoś błąd lub sugestię</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
              Typ zgłoszenia
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('bug')}
                className={`flex-1 px-3 py-2 text-sm border transition-colors ${
                  type === 'bug'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Błąd
              </button>
              <button
                type="button"
                onClick={() => setType('feature')}
                className={`flex-1 px-3 py-2 text-sm border transition-colors ${
                  type === 'feature'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sugestia
              </button>
              <button
                type="button"
                onClick={() => setType('other')}
                className={`flex-1 px-3 py-2 text-sm border transition-colors ${
                  type === 'other'
                    ? 'bg-gray-50 border-gray-300 text-gray-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Inne
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
              Tytuł <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Krótki opis problemu"
              className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
              Opis <span className="text-red-600">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Szczegółowy opis problemu lub sugestii..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none"
              required
            />
          </div>

          {/* Contact email (optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
              Email kontaktowy (opcjonalnie)
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="twoj@email.com"
              className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Podaj email, jeśli chcesz otrzymać odpowiedź
            </p>
          </div>

          {/* Submit button */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
