-- ===================================================
-- FinOS AI - Supabase Database Schema DDL
-- Table definitions for profiles, transactions, subscriptions,
-- budgets, goals, notifications, ai_reports, financial_health
-- ===================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    city TEXT,
    occupation TEXT,
    monthly_income NUMERIC(12, 2) DEFAULT 0.00,
    monthly_rent NUMERIC(12, 2) DEFAULT 0.00,
    monthly_emi NUMERIC(12, 2) DEFAULT 0.00,
    family_members INT DEFAULT 1,
    monthly_savings NUMERIC(12, 2) DEFAULT 0.00,
    financial_goal TEXT,
    preferred_language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'dark',
    currency TEXT DEFAULT '₹',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'UPI',
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    monthly_cost NUMERIC(12, 2) NOT NULL,
    annual_cost NUMERIC(12, 2) NOT NULL,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    next_renewal_date DATE NOT NULL,
    category TEXT DEFAULT 'Entertainment',
    is_used_regularly BOOLEAN DEFAULT TRUE,
    ai_recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    allocated_amount NUMERIC(12, 2) NOT NULL,
    spent_amount NUMERIC(12, 2) DEFAULT 0.00,
    month_year VARCHAR(7) NOT NULL, -- e.g., '2026-08'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category, month_year)
);

-- 5. Financial Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) DEFAULT 0.00,
    target_date DATE NOT NULL,
    monthly_contribution NUMERIC(12, 2) DEFAULT 0.00,
    category TEXT DEFAULT 'Savings',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bill', 'subscription', 'inflation', 'scam', 'system', 'goal')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI Reports Table
CREATE TABLE IF NOT EXISTS public.ai_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('monthly_summary', 'future_prediction', 'scam_audit', 'health_audit')),
    content JSONB NOT NULL,
    summary TEXT,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Financial Health Score Table
CREATE TABLE IF NOT EXISTS public.financial_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 0 AND score <= 100),
    savings_ratio_score INT DEFAULT 0,
    debt_ratio_score INT DEFAULT 0,
    budget_discipline_score INT DEFAULT 0,
    emergency_fund_score INT DEFAULT 0,
    subscription_health_score INT DEFAULT 0,
    bill_payment_score INT DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index optimization for user queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
