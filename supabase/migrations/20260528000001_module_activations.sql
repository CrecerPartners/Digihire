-- Stores per-talent module activation records with registration data.
-- Allows backend segmentation: how many users activated VoltSquad,
-- what gig types are most popular, seller experience distribution, etc.
--
-- Example queries:
--   SELECT module, COUNT(*) FROM talent_module_activations GROUP BY module;
--   SELECT registration_data->>'experience' AS lvl, COUNT(*)
--     FROM talent_module_activations WHERE module = 'voltsquad' GROUP BY 1;

CREATE TABLE IF NOT EXISTS talent_module_activations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id uuid REFERENCES talent_profiles(id) ON DELETE CASCADE,
  module text NOT NULL,
  registration_data jsonb DEFAULT '{}',
  activated_at timestamptz DEFAULT now(),
  UNIQUE(talent_id, module)
);

CREATE INDEX IF NOT EXISTS idx_module_activations_talent ON talent_module_activations(talent_id);
CREATE INDEX IF NOT EXISTS idx_module_activations_module  ON talent_module_activations(module);

ALTER TABLE talent_module_activations ENABLE ROW LEVEL SECURITY;

-- Talents can view their own activation records
CREATE POLICY "talent_activations_select" ON talent_module_activations
  FOR SELECT USING (talent_id = auth.uid());

-- Talents can insert their own record (upsert allowed for re-registration)
CREATE POLICY "talent_activations_insert" ON talent_module_activations
  FOR INSERT WITH CHECK (talent_id = auth.uid());

-- Admin can read and manage all records for analytics / segmentation
CREATE POLICY "admin_activations_all" ON talent_module_activations
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'app_metadata' ->> 'account_type' = 'admin')
  );
