import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Expense, EXPENSE_CATEGORIES } from '../../types/business';
import { Modal } from './Modal';

const currentYearMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const CATEGORY_COLORS: Record<string, string> = {
  'ツール費': 'bg-purple-50 text-purple-700',
  '外注費': 'bg-blue-50 text-blue-700',
  '交通費': 'bg-green-50 text-green-700',
  '通信費': 'bg-yellow-50 text-yellow-800',
  '広告費': 'bg-orange-50 text-orange-700',
  'その他': 'bg-slate-100 text-slate-600',
};

const EMPTY_FORM = {
  year_month: currentYearMonth(),
  category: 'ツール費',
  amount: 0,
  vendor: '',
  description: '',
  expense_date: new Date().toISOString().split('T')[0],
};

export const ExpensesTab: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState(currentYearMonth());

  useEffect(() => { load(); }, [filterMonth]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('year_month', filterMonth)
      .order('expense_date', { ascending: false });
    if (error) setError(error.message);
    else setExpenses(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.amount) return;
    setSaving(true);
    const payload = {
      ...form,
      vendor: form.vendor || null,
      description: form.description || null,
    };
    const { error } = await supabase.from('expenses').insert(payload);
    if (error) setError(error.message);
    else { setShowModal(false); setForm(EMPTY_FORM); load(); }
    setSaving(false);
  };

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);

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
            <p className="text-xs text-slate-500">今月の支出合計</p>
            <p className="text-2xl font-bold text-red-600">¥{totalAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
          <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            <Plus size={16} />支出を追加
          </button>
        </div>
      </div>

      {/* カテゴリ別内訳 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {EXPENSE_CATEGORIES.map(cat => byCategory[cat] > 0 && (
          <div key={cat} className="bg-white rounded-lg border border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500">{cat}</p>
            <p className="text-lg font-bold text-slate-800">¥{byCategory[cat].toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['日付', 'カテゴリ', '金額', '支払先', '内容'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">この月の支出がありません</td></tr>
            )}
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 text-sm text-slate-600">{e.expense_date || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${CATEGORY_COLORS[e.category || 'その他'] || CATEGORY_COLORS['その他']}`}>
                    {e.category || 'その他'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">¥{e.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{e.vendor || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{e.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="支出を追加" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">対象月 *</label>
              <input type="month" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.year_month} onChange={e => setForm(f => ({ ...f, year_month: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">日付</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">カテゴリ</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">金額（円） *</label>
              <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">支払先</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="〇〇株式会社" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">内容</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="ChatGPT Plus 月額" />
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
