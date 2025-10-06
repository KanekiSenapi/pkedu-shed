"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface UserDetails {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  role: string;
  starosta_rok: number | null;
  starosta_groups: string[];
  created_at: string;
}

interface UserManagementModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function UserManagementModal({ userId, isOpen, onClose, onUpdate }: UserManagementModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [loginStats, setLoginStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user');
  const [starostaRok, setStarostaRok] = useState<number>(1);
  const [starostaGroups, setStarostaGroups] = useState<string[]>([]);
  const [newGroup, setNewGroup] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      loadUser();
    }
  }, [isOpen, userId]);

  const loadUser = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setPreferences(data.preferences);
        setLoginStats(data.login_stats);
        setSelectedRole(data.user.role || 'user');
        setStarostaRok(data.user.starosta_rok || 1);
        setStarostaGroups(data.user.starosta_groups || []);
      } else {
        toast.error(data.error || 'Błąd podczas pobierania danych');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Błąd podczas pobierania danych');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          starosta_rok: selectedRole === 'starosta' ? starostaRok : null,
          starosta_groups: selectedRole === 'starosta' ? starostaGroups : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Rola zaktualizowana');
        onUpdate();
        loadUser();
      } else {
        toast.error(data.error || 'Błąd podczas aktualizacji');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Błąd podczas aktualizacji');
    }
  };

  const deleteUser = async () => {
    if (!userId || !confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Użytkownik usunięty');
        onUpdate();
        onClose();
      } else {
        toast.error(data.error || 'Błąd podczas usuwania');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Błąd podczas usuwania');
    }
  };

  const addGroup = () => {
    if (newGroup.trim() && !starostaGroups.includes(newGroup.trim())) {
      setStarostaGroups([...starostaGroups, newGroup.trim()]);
      setNewGroup('');
    }
  };

  const removeGroup = (group: string) => {
    setStarostaGroups(starostaGroups.filter(g => g !== group));
  };

  if (!isOpen) return null;

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
        className="bg-white border border-gray-200 shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Ładowanie...</div>
          </div>
        ) : user ? (
          <>
            {/* Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{user.email}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {user.name || 'Brak imienia'} • Utworzono: {formatDate(user.created_at)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Login Stats */}
              {loginStats && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                    Statystyki logowań
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 p-3">
                      <div className="text-xs text-gray-500 mb-1">Liczba logowań</div>
                      <div className="text-2xl font-bold text-gray-900">{loginStats.count}</div>
                    </div>
                    <div className="border border-gray-200 p-3">
                      <div className="text-xs text-gray-500 mb-1">Ostatnie logowanie</div>
                      <div className="text-sm text-gray-900">
                        {loginStats.last_login ? formatDate(loginStats.last_login) : 'Nigdy'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences */}
              {preferences && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                    Preferencje
                  </h3>
                  <div className="border border-gray-200 p-4">
                    <pre className="text-xs text-gray-900 whitespace-pre-wrap">
                      {JSON.stringify(preferences, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Role Management */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
                  Zarządzanie rolą
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                      Rola
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                    >
                      <option value="user">Użytkownik</option>
                      <option value="starosta">Starosta</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  {selectedRole === 'starosta' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                          Rok studiów
                        </label>
                        <select
                          value={starostaRok}
                          onChange={(e) => setStarostaRok(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                        >
                          <option value={1}>Rok 1</option>
                          <option value={2}>Rok 2</option>
                          <option value={3}>Rok 3</option>
                          <option value={4}>Rok 4</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                          Grupy
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newGroup}
                            onChange={(e) => setNewGroup(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addGroup()}
                            placeholder="Dodaj grupę (np. DS1)"
                            className="flex-1 px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                          />
                          <button
                            onClick={addGroup}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
                          >
                            Dodaj
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {starostaGroups.map(group => (
                            <span
                              key={group}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs border border-blue-200"
                            >
                              {group}
                              <button
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

                  <button
                    onClick={updateRole}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                  >
                    Zaktualizuj rolę
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-red-600 uppercase tracking-wide mb-3">
                  Strefa niebezpieczna
                </h3>
                <button
                  onClick={deleteUser}
                  className="px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                >
                  Usuń użytkownika
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-600">
            Nie znaleziono użytkownika
          </div>
        )}
      </div>
    </div>
  );
}
