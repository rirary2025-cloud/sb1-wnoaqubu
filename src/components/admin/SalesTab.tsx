import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SalesRecord, Client, Project, SALES_STATUS_LABELS } from '../../types/business';
import { Modal } from './Modal';

const STATUS_COLORS: Record<SalesRecord['status'], string> = {
  uninvoiced: 'bg-slate-100 text-slate-600',
  invoiced: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
};

const currentYearMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const EMPTY_FORM = {
  client_id: '',
  project_id: '',
  year_month: currentYearMonth(),
  amount: 0,
  invoiced_at: '',
  paid_at: '',
  status: 'uninvoiced' as SalesRecord['status'],
  notes: '',
};

export const SalesTab: React.FC = () => {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [clients, setClients] = useState<Pick<Client, 'id' | 'company_name'>[]>([]);
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name' | 'client_id'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState(currentYearMonth());

  useEffect(() => { load(); }, [filterMonth]);

  const load = async () => {
    setLoading(true);
    const [{ data: recs }, { data: cli }, { data: proj }] = await Promise.all([
      supabase.from('sales_records').select('*, client:clients(company_name), project:projects(name)').eq('year_month', filterMonth).order('created_at', { ascending: false }),
      supabase.from('clients').select('id, company_name'),
      supabase.from('projects').select('id, name, client_id').eq('status', 'active'),
    ]);
    setRecords((recs as SalesRecord[]) || []);
    setClients(cli || []);
    setProjects((proj as Pick<Project, 'id' | 'name' | 'client_id'>[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: SalesRecord['status']) => {
    const updates: Partial<SalesRecord> = { status };
    if (status === 'invoiced') updates.invoiced_at = new Date().toISOString().split('T')[0];
    if (status === 'paid') updates.paid_at = new Date().toISOString().split('T')[0];
    await supabase.from('sales_records').update(updates).eq('id', id);
    load();
  };

  const save = async () => {
    if (!form.amount || !form.year_month) return;
    setSaving(true);
    const payload = {
      ...form,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      invoiced_at: form.invoiced_at || null,
      paid_at: form.paid_at || null,
      notes: form.notes || null,
    };
    const { error } = await supabase.from('sales_records').insert(payload);
    if (error) setError(error.message);
    else { setShowModal(false); setForm(EMPTY_FORM); load(); }
    setSaving(false);
  };

  const totalAmount = records.reduce((s, r) => s + r.amount, 0);
  const paidAmount = records.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const overdueCount = records.filter(r => r.status === 'overdue').length;

  const filteredProjects = form.client_id ? projects.filter(p => p.client_id === form.client_id) : projects;

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />{error}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-4 flex-wrap">
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp size={12} />請求合計</p>
            <p className="text-2xl font-bold text-slate-900">¥{totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-500">入金済</p>
            <p className="text-2xl font-bold text-green-600">¥{paidAmount.toLocaleString()}</p>
          </div>
          {overdueCount > 0 && (
            <div className="bg-red-50 rounded-lg border border-red-200 px-5 py-3">
              <p className="text-xs text-red-500">未入金（督促要）</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}件</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input type="month" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
          <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            <Plus size={16} />売上を追加
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['顧客・案件', '請求額', '請求日', '入金日', '状態', '操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">この月の売上レコードがありません</td></tr>
            )}
            {records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{r.client?.company_name || '—'}</p>
                  {r.project && <p className="text-xs text-slate-400">{r.project.name}</p>}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">¥{r.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{r.invoiced_at || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{r.paid_at || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>
                    {SALES_STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    onChange={e => updateStatus(r.id, e.target.value as SalesRecord['status'])}
                    className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600"
                  >
                    <option value="uninvoiced">未請求</option>
                    <option value="invoiced">請求済</option>
                    <option value="paid">入金済</option>
                    <option value="overdue">未入金（督促要）</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="売上を追加" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">対象月 *</label>
              <input type="month" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.year_month} onChange={e => setForm(f => ({ ...f, year_month: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">顧客</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, project_id: '' }))}>
                <option value="">未設定</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">案件</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                <option value="">未設定</option>
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">請求額（円） *</label>
              <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">請求日</label>
                <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.invoiced_at} onChange={e => setForm(f => ({ ...f, invoiced_at: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">入金日</label>
                <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.paid_at} onChange={e => setForm(f => ({ ...f, paid_at: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">状態</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SalesRecord['status'] }))}>
                <option value="uninvoiced">未請求</option>
                <option value="invoiced">請求済</option>
                <option value="paid">入金済</option>
                <option value="overdue">未入金（督促要）</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">備考</label>
              <textarea rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition">キャンセル</button>
              <button onClick={save} disabled={saving || !form.amount} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
