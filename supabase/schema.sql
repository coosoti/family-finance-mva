-- =============================================
-- Family Finance - Database Schema
-- Multi-user support with Row Level Security
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    monthly_income DECIMAL(12, 2) NOT NULL DEFAULT 0,
    dependents INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- BUDGET CATEGORIES TABLE
-- =============================================
CREATE TABLE public.budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    budgeted_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('needs', 'wants', 'savings', 'growth')),
    is_default BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_categories_user_id ON public.budget_categories(user_id);
CREATE INDEX idx_budget_categories_type ON public.budget_categories(type);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.budget_categories(id) ON DELETE SET NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'saving', 'ipp', 'asset', 'liability')),
    notes TEXT,
    month TEXT NOT NULL, -- YYYY-MM format
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_month ON public.transactions(month);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);

-- =============================================
-- SAVINGS GOALS TABLE
-- =============================================
CREATE TABLE public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    monthly_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_savings_goals_user_id ON public.savings_goals(user_id);

-- =============================================
-- IPP ACCOUNTS TABLE
-- =============================================
CREATE TABLE public.ipp_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    monthly_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_contributions DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_relief_rate DECIMAL(4, 3) NOT NULL DEFAULT 0.300,
    realized_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ipp_accounts_user_id ON public.ipp_accounts(user_id);

-- =============================================
-- ASSETS TABLE
-- =============================================
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset', 'liability')),
    category TEXT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_type ON public.assets(type);

-- =============================================
-- MONTHLY SNAPSHOTS TABLE
-- =============================================
CREATE TABLE public.monthly_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL, -- YYYY-MM format
    income DECIMAL(12, 2) NOT NULL,
    total_expenses DECIMAL(12, 2) NOT NULL,
    total_savings DECIMAL(12, 2) NOT NULL,
    ipp_contributions DECIMAL(12, 2) NOT NULL DEFAULT 0,
    net_worth DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month)
);

CREATE INDEX idx_monthly_snapshots_user_id ON public.monthly_snapshots(user_id);
CREATE INDEX idx_monthly_snapshots_month ON public.monthly_snapshots(month);

-- =============================================
-- ADDITIONAL INCOME TABLE
-- =============================================
CREATE TABLE public.additional_income (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount DECIMAL(12, 2) NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    month TEXT NOT NULL, -- YYYY-MM format
    deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_additional_income_user_id ON public.additional_income(user_id);
CREATE INDEX idx_additional_income_month ON public.additional_income(month);

-- =============================================
-- INVESTMENTS TABLE
-- =============================================
CREATE TABLE public.investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('money-market', 'unit-trust', 'government-bond', 'stock', 'sacco', 'reit', 'other')),
    units DECIMAL(18, 6) NOT NULL,
    purchase_price DECIMAL(12, 2) NOT NULL,
    current_price DECIMAL(12, 2) NOT NULL,
    purchase_date TIMESTAMPTZ NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_investments_type ON public.investments(type);

-- =============================================
-- DIVIDEND PAYMENTS TABLE
-- =============================================
CREATE TABLE public.dividend_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL CHECK (type IN ('dividend', 'interest')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dividend_payments_user_id ON public.dividend_payments(user_id);
CREATE INDEX idx_dividend_payments_investment_id ON public.dividend_payments(investment_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividend_payments ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Budget Categories Policies
CREATE POLICY "Users can view own budget categories" ON public.budget_categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget categories" ON public.budget_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget categories" ON public.budget_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget categories" ON public.budget_categories
    FOR DELETE USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Savings Goals Policies
CREATE POLICY "Users can view own savings goals" ON public.savings_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals" ON public.savings_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals" ON public.savings_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals" ON public.savings_goals
    FOR DELETE USING (auth.uid() = user_id);

-- IPP Accounts Policies
CREATE POLICY "Users can view own IPP account" ON public.ipp_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IPP account" ON public.ipp_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IPP account" ON public.ipp_accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- Assets Policies
CREATE POLICY "Users can view own assets" ON public.assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets" ON public.assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets" ON public.assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets" ON public.assets
    FOR DELETE USING (auth.uid() = user_id);

-- Monthly Snapshots Policies
CREATE POLICY "Users can view own monthly snapshots" ON public.monthly_snapshots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly snapshots" ON public.monthly_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly snapshots" ON public.monthly_snapshots
    FOR UPDATE USING (auth.uid() = user_id);

-- Additional Income Policies
CREATE POLICY "Users can view own additional income" ON public.additional_income
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own additional income" ON public.additional_income
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own additional income" ON public.additional_income
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own additional income" ON public.additional_income
    FOR DELETE USING (auth.uid() = user_id);

-- Investments Policies
CREATE POLICY "Users can view own investments" ON public.investments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments" ON public.investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments" ON public.investments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments" ON public.investments
    FOR DELETE USING (auth.uid() = user_id);

-- Dividend Payments Policies
CREATE POLICY "Users can view own dividend payments" ON public.dividend_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dividend payments" ON public.dividend_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dividend payments" ON public.dividend_payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dividend payments" ON public.dividend_payments
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON public.budget_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to calculate net worth
CREATE OR REPLACE FUNCTION calculate_net_worth(user_uuid UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    total_assets DECIMAL(12, 2);
    total_liabilities DECIMAL(12, 2);
    additional_income_total DECIMAL(12, 2);
BEGIN
    -- Calculate total assets
    SELECT COALESCE(SUM(amount), 0) INTO total_assets
    FROM public.assets
    WHERE user_id = user_uuid AND type = 'asset';
    
    -- Calculate total liabilities
    SELECT COALESCE(SUM(amount), 0) INTO total_liabilities
    FROM public.assets
    WHERE user_id = user_uuid AND type = 'liability';
    
    -- Calculate additional income
    SELECT COALESCE(SUM(amount), 0) INTO additional_income_total
    FROM public.additional_income
    WHERE user_id = user_uuid AND deleted = false;
    
    RETURN total_assets + additional_income_total - total_liabilities;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Composite indexes for common queries
CREATE INDEX idx_transactions_user_month ON public.transactions(user_id, month);
CREATE INDEX idx_transactions_user_category ON public.transactions(user_id, category_id);
CREATE INDEX idx_monthly_snapshots_user_month ON public.monthly_snapshots(user_id, month);

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.user_profiles IS 'User profile information extending auth.users';
COMMENT ON TABLE public.budget_categories IS 'Budget categories for expense tracking';
COMMENT ON TABLE public.transactions IS 'Financial transactions (expenses, savings, etc.)';
COMMENT ON TABLE public.savings_goals IS 'User savings goals and targets';
COMMENT ON TABLE public.ipp_accounts IS 'Individual Pension Plan accounts';
COMMENT ON TABLE public.assets IS 'User assets and liabilities for net worth calculation';
COMMENT ON TABLE public.monthly_snapshots IS 'Monthly financial snapshots for analytics';
COMMENT ON TABLE public.additional_income IS 'Additional income beyond regular salary';
COMMENT ON TABLE public.investments IS 'Investment portfolio tracking';
COMMENT ON TABLE public.dividend_payments IS 'Dividend and interest payments from investments';