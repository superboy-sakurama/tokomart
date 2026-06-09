-- SCHEMA TAMBAHAN UNTUK LAPORAN DAN ANALITIK KEUANGAN

-- 1. Tambahkan kolom cost_price ke produk untuk menghitung HPP dan Nilai Stok
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0;

-- 2. Tabel Pengeluaran Operasional (Expenses)
CREATE TABLE IF NOT EXISTS operational_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  category TEXT DEFAULT 'Umum',
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Hutang & Piutang (Debts)
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PAYABLE', 'RECEIVABLE')),
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID')) DEFAULT 'UNPAID',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Akun Keuangan (Kas & Bank) untuk Likuiditas
CREATE TABLE IF NOT EXISTS financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CASH', 'BANK')),
  balance NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;

-- Policies (Development: Allow ALL)
DROP POLICY IF EXISTS "Public operational_expenses access" ON operational_expenses;
CREATE POLICY "Public operational_expenses access" ON operational_expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public debts access" ON debts;
CREATE POLICY "Public debts access" ON debts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public financial_accounts access" ON financial_accounts;
CREATE POLICY "Public financial_accounts access" ON financial_accounts FOR ALL USING (true) WITH CHECK (true);

-- Insert dummy accounts if empty
INSERT INTO financial_accounts (name, type, balance)
SELECT 'Kas di Tangan', 'CASH', 4500000
WHERE NOT EXISTS (SELECT 1 FROM financial_accounts WHERE type = 'CASH');

INSERT INTO financial_accounts (name, type, balance)
SELECT 'BCA Toko', 'BANK', 12500000
WHERE NOT EXISTS (SELECT 1 FROM financial_accounts WHERE type = 'BANK');

-- Insert dummy expenses
INSERT INTO operational_expenses (description, category, amount, date)
SELECT 'Gaji Karyawan', 'Gaji', 2500000, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM operational_expenses);

-- Insert dummy debts
INSERT INTO debts (entity, type, amount, due_date, status)
SELECT 'Distributor Kopi ABC', 'PAYABLE', 1500000, CURRENT_DATE + INTERVAL '10 days', 'UNPAID'
WHERE NOT EXISTS (SELECT 1 FROM debts);
