export interface Client {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  service_types: string[];
  monthly_fee: number;
  billing_day: number;
  contract_start: string | null;
  contract_end: string | null;
  status: 'prospect' | 'active' | 'paused' | 'ended';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  client_id: string | null;
  service_type: string | null;
  status: 'prospect' | 'active' | 'paused' | 'completed';
  start_date: string | null;
  end_date: string | null;
  monthly_fee: number;
  deliverables: string | null;
  progress: number;
  next_action: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Pick<Client, 'company_name'>;
}

export interface SalesRecord {
  id: string;
  client_id: string | null;
  project_id: string | null;
  year_month: string;
  amount: number;
  invoiced_at: string | null;
  paid_at: string | null;
  status: 'uninvoiced' | 'invoiced' | 'paid' | 'overdue';
  notes: string | null;
  created_at: string;
  client?: Pick<Client, 'company_name'>;
  project?: Pick<Project, 'name'>;
}

export interface Expense {
  id: string;
  year_month: string;
  category: string | null;
  amount: number;
  vendor: string | null;
  description: string | null;
  expense_date: string | null;
  created_at: string;
}

export const SERVICE_TYPES = ['LINE公式運用代行', 'Instagram・TikTok運用代行', 'SNS総合運用', 'スポット対応', 'その他'] as const;

export const EXPENSE_CATEGORIES = ['ツール費', '外注費', '交通費', '通信費', '広告費', 'その他'] as const;

export const CLIENT_STATUS_LABELS: Record<Client['status'], string> = {
  prospect: '商談中',
  active: '進行中',
  paused: '停止中',
  ended: '終了',
};

export const PROJECT_STATUS_LABELS: Record<Project['status'], string> = {
  prospect: '商談中',
  active: '進行中',
  paused: '停止中',
  completed: '完了',
};

export const SALES_STATUS_LABELS: Record<SalesRecord['status'], string> = {
  uninvoiced: '未請求',
  invoiced: '請求済',
  paid: '入金済',
  overdue: '未入金（督促要）',
};
