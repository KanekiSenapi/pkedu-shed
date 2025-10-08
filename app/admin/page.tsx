"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BugReportModal } from '@/components/admin/BugReportModal';
import { UserManagementModal } from '@/components/admin/UserManagementModal';
import { NotificationCreatorModal } from '@/components/admin/NotificationCreatorModal';
import { ScheduleChangesViewer } from '@/components/admin/ScheduleChangesViewer';
import { InstructorManagement } from '@/components/admin/InstructorManagement';
import { SubjectManagement } from '@/components/admin/SubjectManagement';
import { CandidatesManagement } from '@/components/admin/CandidatesManagement';

interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  role: string;
  created_at: string;
}

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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'stats' | 'notifications' | 'changes' | 'system' | 'instructors' | 'subjects' | 'candidates'>('reports');
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showNotificationCreator, setShowNotificationCreator] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loginStats, setLoginStats] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [localStorageHash, setLocalStorageHash] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/dashboard');
      return;
    }

    const isAdmin = (session.user as any).isAdmin;
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  useEffect(() => {
    // Read localStorage hash on mount
    if (typeof window !== 'undefined') {
      const hash = localStorage.getItem('pk_schedule_hash');
      setLocalStorageHash(hash);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, reportsRes, statsRes, systemRes, notificationsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/bug-reports'),
        fetch('/api/admin/login-stats'),
        fetch('/api/admin/system-info'),
        fetch('/api/notifications'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setLoginStats(statsData);
      }

      if (systemRes.ok) {
        const systemData = await systemRes.json();
        setSystemInfo(systemData);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.notifications || []);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Ładowanie...</div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pl-PL');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug': return 'Błąd';
      case 'feature': return 'Sugestia';
      default: return 'Inne';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Czy na pewno chcesz wyczyścić CAŁĄ bazę danych? Ta operacja jest nieodwracalna!')) {
      return;
    }

    setActionLoading('clear-all');
    try {
      const res = await fetch('/api/admin/clear-all', { method: 'POST' });
      if (res.ok) {
        alert('Baza danych wyczyszczona!');
        await loadData();
      } else {
        const data = await res.json();
        alert(`Błąd: ${data.error || 'Nieznany błąd'}`);
      }
    } catch (error) {
      console.error('Error clearing database:', error);
      alert('Błąd podczas czyszczenia bazy danych');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCronTrigger = async () => {
    if (!confirm('Czy na pewno chcesz wymusić aktualizację planu zajęć?')) {
      return;
    }

    setActionLoading('cron');
    try {
      const res = await fetch('/api/cron', { method: 'GET' });
      if (res.ok) {
        alert('Aktualizacja planu rozpoczęta!');
        await loadData();
      } else {
        const data = await res.json();
        alert(`Błąd: ${data.error || 'Nieznany błąd'}`);
      }
    } catch (error) {
      console.error('Error triggering cron:', error);
      alert('Błąd podczas uruchamiania aktualizacji');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć to powiadomienie?')) {
      return;
    }

    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(`Błąd: ${data.error || 'Nieznany błąd'}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Błąd podczas usuwania powiadomienia');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-bold text-gray-900">Panel Administratora</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Powrót do aplikacji
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Użytkownicy
            </div>
            <div className="text-3xl font-bold text-gray-900">{users.length}</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Zgłoszenia
            </div>
            <div className="text-3xl font-bold text-gray-900">{reports.length}</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Otwarte zgłoszenia
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {reports.filter(r => r.status === 'open').length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-sm border transition-colors ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Zgłoszenia ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm border transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Użytkownicy ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm border transition-colors ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Statystyki logowań
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 text-sm border transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Powiadomienia
          </button>
          <button
            onClick={() => setActiveTab('changes')}
            className={`px-4 py-2 text-sm border transition-colors ${
              activeTab === 'changes'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Historia zmian
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 text-sm border transition-colors ${
              activeTab === 'system'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            System
          </button>
          <button
            onClick={() => setActiveTab('instructors')}
            className={`px-4 py-2 text-sm border transition-colors ${
              activeTab === 'instructors'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Wykładowcy
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 text-sm border transition-colors ${
              activeTab === 'subjects'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Przedmioty
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2 text-sm border transition-colors ${
              activeTab === 'candidates'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Kandydaci
          </button>
        </div>

        {/* Bug Reports Table */}
        <div className={activeTab === 'reports' ? 'block' : 'hidden'}>
          <div className="bg-white border border-gray-200">
            {/* Filters */}
            <div className="border-b border-gray-200 p-4 flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              >
                <option value="all">Wszystkie statusy</option>
                <option value="open">Otwarte</option>
                <option value="in_progress">W trakcie</option>
                <option value="resolved">Rozwiązane</option>
                <option value="closed">Zamknięte</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              >
                <option value="all">Wszystkie typy</option>
                <option value="bug">Błędy</option>
                <option value="feature">Sugestie</option>
                <option value="other">Inne</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Typ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Tytuł
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Kontakt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports
                    .filter(r => statusFilter === 'all' || r.status === statusFilter)
                    .filter(r => typeFilter === 'all' || r.type === typeFilter)
                    .map(report => (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        #{report.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getTypeLabel(report.type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{report.title}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {report.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {report.contact_email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reports.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Brak zgłoszeń
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className={activeTab === 'users' ? 'block' : 'hidden'}>
          <div className="bg-white border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Imię
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Admin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Data rejestracji
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.is_admin ? (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                            Admin
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Brak użytkowników
              </div>
            )}
          </div>
        </div>

        {/* Login Stats Tab */}
        <div className={activeTab === 'stats' ? 'block' : 'hidden'}>
          {loginStats && (
          <div className="space-y-6">
            {/* Top Users */}
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900">Najczęściej logowani użytkownicy</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Imię
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Liczba logowań
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Ostatnie logowanie
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loginStats.stats?.map((stat: any) => (
                      <tr key={stat.user_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{stat.user_email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{stat.user_name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{stat.login_count}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {stat.last_login ? formatDate(stat.last_login) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Logins */}
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900">Ostatnie logowania</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        User Agent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loginStats.recent_logins?.map((login: any) => (
                      <tr key={login.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{login.user_email}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(login.login_at)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono max-w-md truncate">
                          {login.user_agent || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Notifications Tab */}
        <div className={activeTab === 'notifications' ? 'block' : 'hidden'}>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Zarządzanie powiadomieniami</h3>
                <button
                  onClick={() => setShowNotificationCreator(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                >
                  + Nowe powiadomienie
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600">
                  Powiadomienia można tworzyć jako globalne (dla wszystkich) lub targetowane (dla konkretnego roku/grup).
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Typy: Info (niebieskie), Sukces (zielone), Ostrzeżenie (pomarańczowe), Błąd (czerwone)
                </p>
              </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900">Historia powiadomień ({notifications.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Typ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Tytuł
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Wiadomość
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Target
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Data utworzenia
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {notifications.map((notif: any) => (
                      <tr key={notif.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          #{notif.id}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs font-medium ${
                            notif.type === 'success' ? 'bg-green-100 text-green-800' :
                            notif.type === 'error' ? 'bg-red-100 text-red-800' :
                            notif.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {notif.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {notif.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {notif.message}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {notif.target_rok ? `Rok ${notif.target_rok}` : 'Wszyscy'}
                          {notif.target_groups && ` (${notif.target_groups})`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(notif.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Usuń
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {notifications.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Brak powiadomień
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Changes Tab */}
        <div className={activeTab === 'changes' ? 'block' : 'hidden'}>
          <ScheduleChangesViewer />
        </div>

        {/* System Tab */}
        <div className={activeTab === 'system' ? 'block' : 'hidden'}>
          <div className="space-y-6">
            {/* System Info Card */}
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900">Informacje systemowe</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Wersja parsera
                    </div>
                    <div className="text-lg font-mono text-gray-900">
                      {systemInfo?.parserVersion || '-'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Nazwa pliku
                    </div>
                    <div className="text-sm text-gray-900 break-all">
                      {systemInfo?.fileName || '-'}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Hash pliku (baza danych)
                    </div>
                    <div className="text-sm font-mono text-gray-900 break-all">
                      {systemInfo?.fileHash || '-'}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Hash pliku (localStorage cache)
                    </div>
                    <div className="text-sm font-mono text-gray-900 break-all">
                      {localStorageHash || '-'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Ostatnia aktualizacja
                    </div>
                    <div className="text-sm text-gray-900">
                      {systemInfo?.lastUpdated ? formatDate(systemInfo.lastUpdated) : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900">Akcje systemowe</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCronTrigger}
                    disabled={actionLoading === 'cron'}
                    className="px-4 py-3 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    {actionLoading === 'cron' ? (
                      <span>⏳ Aktualizowanie planu zajęć...</span>
                    ) : (
                      <div>
                        <div className="font-medium">🔄 Wymuś aktualizację planu</div>
                        <div className="text-xs text-blue-100 mt-1">
                          Pobiera najnowszy plik z PK i aktualizuje bazę danych
                        </div>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={handleClearAll}
                    disabled={actionLoading === 'clear-all'}
                    className="px-4 py-3 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    {actionLoading === 'clear-all' ? (
                      <span>⏳ Czyszczenie bazy danych...</span>
                    ) : (
                      <div>
                        <div className="font-medium">🗑️ Wyczyść całą bazę danych</div>
                        <div className="text-xs text-red-100 mt-1">
                          UWAGA: Usuwa wszystkie dane użytkowników, plan zajęć, obecności, notatki (NIEODWRACALNE!)
                        </div>
                      </div>
                    )}
                  </button>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 text-xs text-yellow-900">
                  ⚠️ Te operacje są nieodwracalne. Upewnij się przed wykonaniem!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructors Management */}
        <div className={activeTab === 'instructors' ? 'block' : 'hidden'}>
          <InstructorManagement />
        </div>

        {/* Subjects Management */}
        <div className={activeTab === 'subjects' ? 'block' : 'hidden'}>
          <SubjectManagement />
        </div>

        {/* Candidates Management */}
        <div className={activeTab === 'candidates' ? 'block' : 'hidden'}>
          <CandidatesManagement />
        </div>
      </main>

      {/* Bug Report Modal */}
      <BugReportModal
        reportId={selectedReportId}
        isOpen={selectedReportId !== null}
        onClose={() => setSelectedReportId(null)}
        onUpdate={loadData}
      />

      {/* User Management Modal */}
      <UserManagementModal
        userId={selectedUserId}
        isOpen={selectedUserId !== null}
        onClose={() => setSelectedUserId(null)}
        onUpdate={loadData}
      />

      {/* Notification Creator Modal */}
      <NotificationCreatorModal
        isOpen={showNotificationCreator}
        onClose={() => setShowNotificationCreator(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
