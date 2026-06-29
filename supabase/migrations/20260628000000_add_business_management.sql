-- 顧客マスター
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  service_types text[] DEFAULT '{}',
  monthly_fee integer DEFAULT 0,
  billing_day integer DEFAULT 1,
  contract_start date,
  contract_end date,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 案件管理
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  service_type text,
  status text DEFAULT 'active',
  start_date date,
  end_date date,
  monthly_fee integer DEFAULT 0,
  deliverables text,
  progress integer DEFAULT 0,
  next_action text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 売上・入金管理
CREATE TABLE IF NOT EXISTS sales_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  year_month text NOT NULL,
  amount integer NOT NULL,
  invoiced_at date,
  paid_at date,
  status text DEFAULT 'uninvoiced',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 支出・経費管理
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month text NOT NULL,
  category text,
  amount integer NOT NULL,
  vendor text,
  description text,
  expense_date date,
  created_at timestamptz DEFAULT now()
);

-- RLS有効化
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- admin のみ全操作可（既存パターン踏襲）
CREATE POLICY "admin_all_clients" ON clients
  USING (EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_all_projects" ON projects
  USING (EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_all_sales_records" ON sales_records
  USING (EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_all_expenses" ON expenses
  USING (EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role = 'admin'));
