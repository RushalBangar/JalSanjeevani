-- ==============================================================================
-- JalSanjeevani (RouteGuard) Supabase Database Schema
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create Villages Table (Distress Matrix & Demographics)
CREATE TABLE IF NOT EXISTS public.villages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('critical', 'warning', 'safe')),
    population INTEGER NOT NULL DEFAULT 0,
    cattle INTEGER NOT NULL DEFAULT 0,
    depletion_rate TEXT DEFAULT '-0.0 cm/day',
    hours_remaining INTEGER DEFAULT 72,
    cistern_level TEXT DEFAULT '50%',
    cistern_capacity INTEGER DEFAULT 25000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Tankers Table (Fleet Telemetry & Geofencing)
CREATE TABLE IF NOT EXISTS public.tankers (
    id TEXT PRIMARY KEY,
    registration TEXT NOT NULL,
    capacity_liters INTEGER NOT NULL DEFAULT 10000,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    is_rogue BOOLEAN NOT NULL DEFAULT false,
    anomaly_detail TEXT,
    target_village TEXT,
    driver_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Dispatches Table (OR-Tools Route Optimization Runs)
CREATE TABLE IF NOT EXISTS public.dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routes JSONB NOT NULL,
    total_liters INTEGER DEFAULT 0,
    algorithm TEXT DEFAULT 'Google OR-Tools CVRP',
    dispatched_by TEXT DEFAULT 'Collector Command Center',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Delivery Receipts Table (Panchayat QR Code Proof-of-Delivery)
CREATE TABLE IF NOT EXISTS public.delivery_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village TEXT NOT NULL,
    tanker TEXT NOT NULL,
    volume_liters INTEGER NOT NULL DEFAULT 10000,
    driver_key TEXT,
    cistern_key TEXT,
    signature TEXT,
    status TEXT NOT NULL DEFAULT 'VERIFIED_DELIVERED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Escrow Actions Table (Contractor Penalties & Fund Freezes)
CREATE TABLE IF NOT EXISTS public.escrow_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanker_id TEXT NOT NULL,
    penalty_amount TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'FROZEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- Row Level Security (RLS) Policies (Permissive for Demo & Operational Access)
-- ==============================================================================
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tankers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_actions ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated roles full access for prototype demonstration
DO $$
BEGIN
    -- Villages Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'villages' AND policyname = 'Allow public read access to villages') THEN
        CREATE POLICY "Allow public read access to villages" ON public.villages FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'villages' AND policyname = 'Allow public write access to villages') THEN
        CREATE POLICY "Allow public write access to villages" ON public.villages FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Tankers Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tankers' AND policyname = 'Allow public read access to tankers') THEN
        CREATE POLICY "Allow public read access to tankers" ON public.tankers FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tankers' AND policyname = 'Allow public write access to tankers') THEN
        CREATE POLICY "Allow public write access to tankers" ON public.tankers FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Dispatches Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dispatches' AND policyname = 'Allow public read access to dispatches') THEN
        CREATE POLICY "Allow public read access to dispatches" ON public.dispatches FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dispatches' AND policyname = 'Allow public write access to dispatches') THEN
        CREATE POLICY "Allow public write access to dispatches" ON public.dispatches FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Delivery Receipts Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_receipts' AND policyname = 'Allow public read access to delivery_receipts') THEN
        CREATE POLICY "Allow public read access to delivery_receipts" ON public.delivery_receipts FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_receipts' AND policyname = 'Allow public write access to delivery_receipts') THEN
        CREATE POLICY "Allow public write access to delivery_receipts" ON public.delivery_receipts FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Escrow Actions Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'escrow_actions' AND policyname = 'Allow public read access to escrow_actions') THEN
        CREATE POLICY "Allow public read access to escrow_actions" ON public.escrow_actions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'escrow_actions' AND policyname = 'Allow public write access to escrow_actions') THEN
        CREATE POLICY "Allow public write access to escrow_actions" ON public.escrow_actions FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ==============================================================================
-- Enable Supabase Realtime for Dynamic Map Updates
-- ==============================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.villages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tankers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_receipts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_actions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- Initial Seed Data: Sinnar Taluka, Maharashtra
-- ==============================================================================
INSERT INTO public.villages (id, name, lat, lng, status, population, cattle, depletion_rate, hours_remaining, cistern_level, cistern_capacity)
VALUES
    ('1', 'Pangari', 19.85, 73.95, 'critical', 2400, 800, '-4.8 cm/day', 18, '12%', 25000),
    ('2', 'Wadgaon', 19.81, 74.05, 'warning', 1500, 450, '-2.1 cm/day', 96, '38%', 25000),
    ('3', 'Khopadi', 19.90, 74.10, 'critical', 3200, 1200, '-5.2 cm/day', 14, '8%', 25000),
    ('4', 'Nandur', 19.78, 73.90, 'safe', 4100, 1500, '-0.8 cm/day', 380, '72%', 30000)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    population = EXCLUDED.population,
    cattle = EXCLUDED.cattle,
    depletion_rate = EXCLUDED.depletion_rate,
    hours_remaining = EXCLUDED.hours_remaining,
    cistern_level = EXCLUDED.cistern_level;

INSERT INTO public.tankers (id, registration, capacity_liters, lat, lng, status, is_rogue, anomaly_detail, target_village, driver_name)
VALUES
    ('TN-12', 'MH-15-AG-402', 10000, 19.83, 73.98, 'en_route', false, 'Geofence Compliant', 'Pangari', 'Suresh Jadhav'),
    ('TN-04', 'MH-15-AG-982', 10000, 19.88, 74.02, 'en_route', false, 'Geofence Compliant', 'Khopadi', 'Ramesh Shinde'),
    ('TN-07', 'MH-15-TK-889', 10000, 19.75, 74.15, 'diverted', true, '12km Off-Route Anomaly - GPS Handshake Missing', 'Unassigned', 'Unknown / Rogue')
ON CONFLICT (id) DO UPDATE SET
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    is_rogue = EXCLUDED.is_rogue,
    status = EXCLUDED.status;
