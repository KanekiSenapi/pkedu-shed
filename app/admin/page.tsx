"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
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
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('reports');

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
  }, [session, status, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, reportsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/bug-reports'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
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
        <div className="flex gap-2 mb-6">
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
        </div>

        {/* Bug Reports Table */}
        {activeTab === 'reports' && (
          <div className="bg-white border border-gray-200">
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
                  {reports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50">
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
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
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
                    <tr key={user.id} className="hover:bg-gray-50">
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
        )}
      </main>
    </div>
  );
}
