import React, { useState, useEffect } from 'react';
import { Plus, Edit2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Project, Client, SERVICE_TYPES, PROJECT_STATUS_LABELS } from '../../types/business';
import { Modal } from './Modal';

const STATUS_COLORS: Record<Project['status'], string> = {
  prospect: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-slate-100 text-slate-700',
  completed: 'bg-blue-100 text-blue-800',
};

const EMPTY_FORM = {
  name: '',
  client_id: '',
  service_type: '',
  status: 'active' as Project['status'],
  start_date: '',
  end_date: '',
  monthly_fee: 0,
  deliverables: '',
  progress: 0,
  next_action: '',
  notes: '',
};

export const ProjectsTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Pick<Client, 'id' | 'company_name'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: proj }, { data: cli }] = await Promise.all([
      supabase.from('projects').select('*, client:clients(company_name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, company_name').eq('status', 'active'),
    ]);
    setProjects((proj as Project[]) || []);
    setClients(cli || []);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      name: p.name,
      client_id: p.client_id || '',
      service_type: p.service_type || '',
      status: p.status,
      start_date: p.start_date || '',
      end_date: p.end_date || '',
      monthly_fee: p.monthly_fee,
      deliverables: p.deliverables || '',
      progress: p.progress,
      next_action: p.next_action || '',
      notes: p.notes || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      client_id: form.client_id || null,
      service_type: form.service_type || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      deliverables: form.deliverables || null,
      next_action: form.next_action || null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase.from('projects').update(payload).eq('id', editing.id)
      : await supabase.from('projects').insert(payload);
    if (error) setError(error.message);
    else { setShowModal(false); load(); }
    setSaving(false);
  };

  const activeCount = projects.filter(p => p.status === 'active').length;

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />{error}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-6">
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-500">総案件数</p>
            <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-500">進行中</p>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} />案件を追加
        </button>
      </div>

      <div className="space-y-3">
        {projects.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">案件がまだ登録されていません</div>
        )}
        {projects.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                    {PROJECT_STATUS_LABELS[p.status]}
                  </span>
                  {p.service_type && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p.service_type}</span>}
                </div>
                {p.client && <p className="text-xs text-slate-500 mb-2">{p.client.company_name}</p>}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{p.progress}%</span>
                </div>
                {p.next_action && (
                  <p className="text-xs text-slate-600"><span className="font-medium">次のアクション：</span>{p.next_action}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {p.monthly_fee > 0 && <p className="text-sm font-bold text-slate-900">¥{p.monthly_fee.toLocaleString()}/月</p>}
                <button onClick={() => openEdit(p)} className="mt-2 text-slate-400 hover:text-blue-600 transition">
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? '案件を編集' : '案件を追加'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">案件名 *</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="〇〇社 LINE運用" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">顧客</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">未設定</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">サービス種別</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}>
                <option value="">未設定</option>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">状態</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Project['status'] }))}>
                  <option value="prospect">商談中</option>
                  <option value="active">進行中</option>
                  <option value="paused">停止中</option>
                  <option value="completed">完了</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">月額（円）</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.monthly_fee} onChange={e => setForm(f => ({ ...f, monthly_fee: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">開始日</label>
                <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">期限</label>
                <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">進捗 ({form.progress}%)</label>
              <input type="range" min={0} max={100} step={5} className="w-full" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">今月の納品物</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.deliverables} onChange={e => setForm(f => ({ ...f, deliverables: e.target.value }))} placeholder="投稿12本、月次レポート" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">次回アクション</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.next_action} onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))} placeholder="7/5 コンテンツ確認MTG" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">備考</label>
              <textarea rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition">キャンセル</button>
              <button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
