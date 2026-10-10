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
-- Initial Seed Data: Ahilyanagar District & Sinnar Taluka, Maharashtra
-- ==============================================================================
INSERT INTO public.villages (id, name, lat, lng, status, population, cattle, depletion_rate, hours_remaining, cistern_level, cistern_capacity)
VALUES
    ('AH-01', 'Tisgaon (Pathardi)', 19.1415, 75.0512, 'critical', 4850, 1620, '-5.4 cm/day', 14, '9%', 30000),
    ('AH-02', 'Supa (Parner)', 18.9984, 74.4568, 'critical', 3900, 1250, '-4.9 cm/day', 22, '14%', 25000),
    ('AH-03', 'Kharki (Jamkhed)', 18.7280, 75.3120, 'critical', 2800, 980, '-6.1 cm/day', 11, '7%', 25000),
    ('AH-04', 'Rashin (Karjat)', 18.5526, 75.0064, 'warning', 5200, 2100, '-3.4 cm/day', 56, '28%', 35000),
    ('AH-05', 'Bodhegaon (Shevgaon)', 19.3486, 75.2185, 'warning', 3450, 1120, '-2.8 cm/day', 72, '34%', 25000),
    ('AH-06', 'Ashwi (Sangamner)', 19.5772, 74.2085, 'warning', 3150, 1050, '-3.1 cm/day', 64, '31%', 25000),
    ('AH-07', 'Vambori (Rahuri)', 19.3905, 74.6514, 'safe', 6100, 2400, '-1.1 cm/day', 210, '68%', 40000),
    ('AH-08', 'Kashti (Shrigonda)', 18.6148, 74.6969, 'safe', 4300, 1540, '-1.3 cm/day', 180, '62%', 30000),
    ('AH-09', 'Bhingar Rural (Nagar)', 19.1120, 74.7710, 'safe', 5800, 1400, '-0.9 cm/day', 340, '78%', 45000),
    ('SN-01', 'Pangari Bk (Sinnar)', 19.8512, 73.9540, 'critical', 2450, 820, '-4.8 cm/day', 16, '11%', 25000),
    ('SN-02', 'Khopadi (Sinnar)', 19.9015, 74.1030, 'critical', 3350, 1280, '-5.2 cm/day', 13, '7%', 25000),
    ('SN-03', 'Wadgaon (Sinnar)', 19.8130, 74.0520, 'warning', 1620, 490, '-2.3 cm/day', 88, '36%', 25000),
    ('SN-04', 'Dubere (Sinnar)', 19.8210, 73.9120, 'warning', 2900, 940, '-2.6 cm/day', 78, '33%', 25000),
    ('SN-05', 'Dapur (Sinnar)', 19.8820, 73.9210, 'safe', 2100, 670, '-1.2 cm/day', 195, '65%', 25000),
    ('SN-06', 'Nandur Shingote', 19.7820, 73.9010, 'safe', 5400, 1850, '-0.8 cm/day', 380, '74%', 40000)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    status = EXCLUDED.status,
    population = EXCLUDED.population,
    cattle = EXCLUDED.cattle,
    depletion_rate = EXCLUDED.depletion_rate,
    hours_remaining = EXCLUDED.hours_remaining,
    cistern_level = EXCLUDED.cistern_level,
    cistern_capacity = EXCLUDED.cistern_capacity;

INSERT INTO public.tankers (id, registration, capacity_liters, lat, lng, status, is_rogue, anomaly_detail, target_village, driver_name)
VALUES
    ('TN-AH-01', 'MH-16-AY-2104', 12000, 19.1250, 74.8210, 'en_route', false, 'Geofence Compliant (Nagar-Pathardi Route)', 'Tisgaon (Pathardi)', 'Balasaheb Thorat'),
    ('TN-AH-02', 'MH-16-BZ-5512', 10000, 18.7840, 75.2510, 'en_route', false, 'Geofence Compliant (Jamkhed Emergency Line)', 'Kharki (Jamkhed)', 'Nitin Garje'),
    ('TN-AH-03', 'MH-16-CD-8841', 12000, 19.0310, 74.5210, 'en_route', false, 'Geofence Compliant (Parner Industrial Line)', 'Supa (Parner)', 'Gorakh Shinde'),
    ('TN-SN-01', 'MH-15-AG-4029', 10000, 19.8410, 73.9720, 'en_route', false, 'Geofence Compliant (Sinnar-Pangari Corridor)', 'Pangari Bk (Sinnar)', 'Suresh Jadhav'),
    ('TN-SN-02', 'MH-15-AG-9821', 10000, 19.8920, 74.0610, 'en_route', false, 'Geofence Compliant (Sinnar-Khopadi Corridor)', 'Khopadi (Sinnar)', 'Ramesh Shinde'),
    ('TN-ROGUE', 'MH-16-TX-9901', 10000, 18.6210, 74.9210, 'diverted', true, '14km Off-Route Anomaly - Diverted towards private commercial site', 'Unassigned', 'Flagged Contractor / Unknown')
ON CONFLICT (id) DO UPDATE SET
    registration = EXCLUDED.registration,
    capacity_liters = EXCLUDED.capacity_liters,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    is_rogue = EXCLUDED.is_rogue,
    status = EXCLUDED.status,
    anomaly_detail = EXCLUDED.anomaly_detail,
    target_village = EXCLUDED.target_village,
    driver_name = EXCLUDED.driver_name;

