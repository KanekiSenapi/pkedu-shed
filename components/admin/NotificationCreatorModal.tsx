"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface NotificationCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NotificationCreatorModal({ isOpen, onClose, onSuccess }: NotificationCreatorModalProps) {
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isTargeted, setIsTargeted] = useState(false);
  const [targetRok, setTargetRok] = useState<number | null>(null);
  const [targetGroups, setTargetGroups] = useState<string[]>([]);
  const [newGroup, setNewGroup] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error('Tytuł i treść są wymagane');
      return;
    }

    if (isTargeted && !targetRok && targetGroups.length === 0) {
      toast.error('Dla powiadomień targetowanych wybierz rok lub grupy');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          message: message.trim(),
          target_rok: isTargeted ? targetRok : null,
          target_groups: isTargeted && targetGroups.length > 0 ? targetGroups : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Powiadomienie utworzone');
        setTitle('');
        setMessage('');
        setIsTargeted(false);
        setTargetRok(null);
        setTargetGroups([]);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Błąd podczas tworzenia powiadomienia');
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Błąd podczas tworzenia powiadomienia');
    } finally {
      setLoading(false);
    }
  };

  const addGroup = () => {
    if (newGroup.trim() && !targetGroups.includes(newGroup.trim())) {
      setTargetGroups([...targetGroups, newGroup.trim()]);
      setNewGroup('');
    }
  };

  const removeGroup = (group: string) => {
    setTargetGroups(targetGroups.filter(g => g !== group));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 shadow-lg max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-gray-900">Nowe powiadomienie</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Typ
            </label>
            <div className="flex gap-2">
              {(['info', 'success', 'warning', 'error'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-2 text-sm border transition-colors ${
                    type === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t === 'info' && 'Info'}
                  {t === 'success' && 'Sukces'}
                  {t === 'warning' && 'Ostrzeżenie'}
                  {t === 'error' && 'Błąd'}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Tytuł
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tytuł powiadomienia"
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Treść
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Treść powiadomienia"
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              required
            />
          </div>

          {/* Targeting */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTargeted}
                onChange={(e) => setIsTargeted(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-900">
                Powiadomienie targetowane (dla konkretnego roku/grup)
              </span>
            </label>
          </div>

          {isTargeted && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  Rok studiów (opcjonalne)
                </label>
                <select
                  value={targetRok || ''}
                  onChange={(e) => setTargetRok(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="">Wszystkie lata</option>
                  <option value={1}>Rok 1</option>
                  <option value={2}>Rok 2</option>
                  <option value={3}>Rok 3</option>
                  <option value={4}>Rok 4</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  Grupy (opcjonalne)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGroup())}
                    placeholder="Dodaj grupę (np. DS1)"
                    className="flex-1 px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                  <button
                    type="button"
                    onClick={addGroup}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
                  >
                    Dodaj
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {targetGroups.map(group => (
                    <span
                      key={group}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs border border-blue-200"
                    >
                      {group}
                      <button
                        type="button"
                        onClick={() => removeGroup(group)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Tworzenie...' : 'Utwórz powiadomienie'}
          </button>
        </form>
      </div>
    </div>
  );
}
