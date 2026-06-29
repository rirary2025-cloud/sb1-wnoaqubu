import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Phone, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Client, SERVICE_TYPES, CLIENT_STATUS_LABELS } from '../../types/business';
import { Modal } from './Modal';

const STATUS_COLORS: Record<Client['status'], string> = {
  prospect: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-slate-100 text-slate-700',
  ended: 'bg-red-100 text-red-800',
};

const EMPTY_FORM = {
  company_name: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  service_types: [] as string[],
  monthly_fee: 0,
  billing_day: 1,
  contract_start: '',
  contract_end: '',
  status: 'active' as Client['status'],
  notes: '',
};

export const ClientsTab: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setClients(data || []);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      company_name: c.company_name,
      contact_name: c.contact_name || '',
      contact_email: c.contact_email || '',
      contact_phone: c.contact_phone || '',
      service_types: c.service_types || [],
      monthly_fee: c.monthly_fee,
      billing_day: c.billing_day,
      contract_start: c.contract_start || '',
      contract_end: c.contract_end || '',
      status: c.status,
      notes: c.notes || '',
    });
    setShowModal(true);
  };

  const toggleService = (s: string) => {
    setForm(f => ({
      ...f,
      service_types: f.service_types.includes(s)
        ? f.service_types.filter(x => x !== s)
        : [...f.service_types, s],
    }));
  };

  const save = async () => {
    if (!form.company_name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      contract_start: form.contract_start || null,
      contract_end: form.contract_end || null,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase.from('clients').update(payload).eq('id', editing.id)
      : await supabase.from('clients').insert(payload);
    if (error) setError(error.message);
    else { setShowModal(false); load(); }
    setSaving(false);
  };

  const totalMRR = clients.filter(c => c.status === 'active').reduce((s, c) => s + c.monthly_fee, 0);

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
            <p className="text-xs text-slate-500">顧客数</p>
            <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-500">進行中MRR（月額合計）</p>
            <p className="text-2xl font-bold text-blue-600">¥{totalMRR.toLocaleString()}</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} />顧客を追加
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['会社名', 'サービス', '月額', '担当者', '状態', '操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">顧客がまだ登録されていません</td></tr>
            )}
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 text-sm">{c.company_name}</p>
                  {c.contract_start && <p className="text-xs text-slate-400">契約:{c.contract_start}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(c.service_types || []).map(s => (
                      <span key={s} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">¥{c.monthly_fee.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {c.contact_name && <p className="text-sm text-slate-700">{c.contact_name}</p>}
                  {c.contact_phone && <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={10} />{c.contact_phone}</p>}
                  {c.contact_email && <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} />{c.contact_email}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[c.status]}`}>
                    {CLIENT_STATUS_LABELS[c.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(c)} className="text-slate-500 hover:text-blue-600 transition">
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? '顧客を編集' : '顧客を追加'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">会社名 *</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="株式会社〇〇" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">担当者名</label>
                <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">電話番号</label>
                <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">メールアドレス</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">サービス種別</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map(s => (
                  <button key={s} type="button" onClick={() => toggleService(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${form.service_types.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:border-blue-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">月額（円）</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.monthly_fee} onChange={e => setForm(f => ({ ...f, monthly_fee: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">請求日</label>
                <input type="number" min={1} max={31} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.billing_day} onChange={e => setForm(f => ({ ...f, billing_day: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">契約開始日</label>
                <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.contract_start} onChange={e => setForm(f => ({ ...f, contract_start: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">契約終了日</label>
                <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.contract_end} onChange={e => setForm(f => ({ ...f, contract_end: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">状態</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Client['status'] }))}>
                <option value="prospect">商談中</option>
                <option value="active">進行中</option>
                <option value="paused">停止中</option>
                <option value="ended">終了</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">備考</label>
              <textarea rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition">キャンセル</button>
              <button onClick={save} disabled={saving || !form.company_name.trim()} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
