import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, Users, MapPin, LogOut, AlertCircle,
  Eye, EyeOff, TrendingUp, Briefcase, CreditCard, Receipt,
} from 'lucide-react';
import { ClientsTab } from '../components/admin/ClientsTab';
import { ProjectsTab } from '../components/admin/ProjectsTab';
import { SalesTab } from '../components/admin/SalesTab';
import { ExpensesTab } from '../components/admin/ExpensesTab';

interface Member {
  id: string;
  display_name: string;
  user_id: string;
  branch_id: string;
  visible: boolean;
  payment_status: string;
  last_updated_by: string;
  updated_at: string;
}

interface Branch {
  id: string;
  name: string;
  region: string;
  member_count: number;
}

interface DashboardKPI {
  mrr: number;
  activeProjects: number;
  overdueCount: number;
}

type ActiveTab = 'dashboard' | 'clients' | 'projects' | 'sales' | 'expenses' | 'members' | 'branches';

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'ダッシュボード', icon: <BarChart3 size={16} /> },
  { id: 'clients', label: '顧客管理', icon: <Users size={16} /> },
  { id: 'projects', label: '案件管理', icon: <Briefcase size={16} /> },
  { id: 'sales', label: '売上管理', icon: <TrendingUp size={16} /> },
  { id: 'expenses', label: '経費管理', icon: <Receipt size={16} /> },
  { id: 'members', label: '会員管理', icon: <Eye size={16} /> },
  { id: 'branches', label: '支部管理', icon: <MapPin size={16} /> },
];

export const Admin: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [kpi, setKpi] = useState<DashboardKPI>({ mrr: 0, activeProjects: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const checkAdminAccess = async () => {
      const { data, error } = await supabase.from('members').select('role').eq('user_id', user.id).maybeSingle();
      if (error || data?.role !== 'admin') { setError('管理者権限がありません'); navigate('/'); return; }
      loadData();
    };
    checkAdminAccess();
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: membersData },
        { data: branchesData },
        { data: clientsData },
        { data: projectsData },
        { data: salesData },
      ] = await Promise.all([
        supabase.from('members').select('*').order('updated_at', { ascending: false }),
        supabase.from('branches').select('*').order('region', { ascending: true }),
        supabase.from('clients').select('monthly_fee, status'),
        supabase.from('projects').select('status'),
        supabase.from('sales_records').select('status').eq('year_month', currentYearMonth()),
      ]);

      setMembers(membersData || []);
      setBranches(branchesData || []);

      const mrr = (clientsData || []).filter((c: any) => c.status === 'active').reduce((s: number, c: any) => s + (c.monthly_fee || 0), 0);
      const activeProjects = (projectsData || []).filter((p: any) => p.status === 'active').length;
      const overdueCount = (salesData || []).filter((s: any) => s.status === 'overdue').length;
      setKpi({ mrr, activeProjects, overdueCount });
    } catch (err: any) {
      setError(err.message || 'データ読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const currentYearMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const toggleVisibility = async (memberId: string, currentVisible: boolean) => {
    const { error } = await supabase.from('members').update({ visible: !currentVisible }).eq('id', memberId);
    if (error) setError(error.message);
    else loadData();
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const activeMembersCount = members.filter(m => m.payment_status === 'active').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-red-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><BarChart3 size={24} />株式会社Riraly 管理画面</h1>
            <p className="text-red-200 text-xs mt-0.5">経営企画室 ｜ Claude Code</p>
          </div>
          <button onClick={handleSignOut} className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded flex items-center gap-2 transition text-sm">
            <LogOut size={16} />ログアウト
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto p-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle size={16} />{error}
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-4 px-3 font-medium text-sm transition border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">ビジネスKPI</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <p className="text-slate-500 text-xs font-medium mb-1">月次売上（MRR）</p>
                <p className="text-3xl font-bold text-blue-600">¥{kpi.mrr.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">進行中顧客の月額合計</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium mb-1">進行中案件</p>
                    <p className="text-3xl font-bold text-green-600">{kpi.activeProjects}</p>
                  </div>
                  <Briefcase className="text-green-400" size={36} />
                </div>
              </div>
              {kpi.overdueCount > 0 ? (
                <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-5">
                  <p className="text-red-500 text-xs font-medium mb-1">未入金（督促要）</p>
                  <p className="text-3xl font-bold text-red-600">{kpi.overdueCount}件</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-medium mb-1">未入金</p>
                      <p className="text-3xl font-bold text-slate-900">0件</p>
                    </div>
                    <CreditCard className="text-slate-300" size={36} />
                  </div>
                </div>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-4">守成マップ KPI</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium">総会員数</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{members.length}</p>
                  </div>
                  <Users className="text-blue-400" size={36} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium">有効会員</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{activeMembersCount}</p>
                  </div>
                  <Eye className="text-blue-400" size={36} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium">支部数</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{branches.length}</p>
                  </div>
                  <MapPin className="text-blue-400" size={36} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'projects' && <ProjectsTab />}
        {activeTab === 'sales' && <SalesTab />}
        {activeTab === 'expenses' && <ExpensesTab />}

        {activeTab === 'members' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['名前', '支部', '支払い', '表示', '更新者', '操作'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-slate-900">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-900">{member.display_name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{member.branch_id}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${member.payment_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                          {member.payment_status === 'active' ? 'アクティブ' : '非アクティブ'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {member.visible ? <Eye className="text-green-600" size={18} /> : <EyeOff className="text-slate-400" size={18} />}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600">
                        {member.last_updated_by === 'admin' ? '管理者' : '本人'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <button onClick={() => toggleVisibility(member.id, member.visible)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition text-sm">
                          {member.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                          {member.visible ? '非表示' : '表示'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((branch) => (
              <div key={branch.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{branch.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{branch.region}</p>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-slate-900">{branch.member_count}</p>
                  <p className="text-xs text-slate-500">会員数</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
