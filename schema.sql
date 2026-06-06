-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ZONES TABLE
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    zone_password_salt TEXT NOT NULL,
    zone_password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed zone names with secure salted SHA-256 hashes only.
INSERT INTO zones (name, zone_password_salt, zone_password_hash)
VALUES
  ('CHASATO', '1b494e109107d92447862b7ae3ba71d3', '73149ca4d1507c6f2e7058a23062b5e21fcb578c906754a5dbc10e6d539eecf4'),
  ('CHIKANGAWA', '13096668798f4d3a838fba84cb0c304e', '87b588beac87b06c7dc48ae5dfbb2f55b6a1e3fd4e17311230f7a9857b574755'),
  ('CHIZUNGU', '46f16cb5037bcce907ec01fd75951d4e', 'd4621b8e0f88f5495231244cd3c218815e0a9017b5957d1ab7deef05085e4891'),
  ('EDINGENI', '576c35766feeee0ffb6431b8abc6e1b2', '091037c5c0a22cb1c2bba426906ce8d5f6b251b8a43146c631fd8542373cb7f6'),
  ('EMFENI', '87dd9c1df2f869f9bee6b4f6b36d1c3f', '4ed3e7ebe31c33996435214455d786a6de4ce0f8b52d6bca1b9c5859121cc11e'),
  ('ENDINDENI', '9fc8b3ed67da931928e64b92cbf1fc60', 'a0a8a862d4b43c184e4f81e2646a2ab3567cd168e242ab25d888551800f68ada'),
  ('EPHANGWENI', 'cf60c960ef23f5b96542b60461b3c636', 'b4f44533b769f45b6ad7fb64965920e7918a14495fc2c0b0a0ea49f9224b1cf4'),
  ('KABENA', '18a9eb083ccce233cf5dd0335da3439d', 'd02e0ed60203516dc7fb203c8aab2e957a6288fba22c331719bd263e8fbb26c5'),
  ('KABUWA', '653113e61cf7bfcb3e80f1554275afb7', 'ab618a7f1e78003cfdc7b249a5f15cfac8c6260dbd071dcd7cf4eb1963374086'),
  ('KANJUCHI', 'ae285fbe8d82d1526f1066411e9501dc', 'a356ad954dc443f891746c617777480be2ac7aedea949762c72ac6e9a6e90c0c'),
  ('KAPHUTA', 'b26ed719ac90225d411494d8bdb15718', '618b17c96b3dd42a5c59088c777f849d12637cc9447f462596b4fff3c9b26eb4'),
  ('KAPOLI', 'f656e83f4d448a4f54c3a0b893de22ce', 'a8178f42535cd95ecf7272b94aede34c04428f00b778c22cf70d8e2ceee6cc91'),
  ('KATETE', 'e0aeca462923238f62bd9ed81788ada4', 'fc87ca66a61559925a424e15f95904f4b900c51d20d6266eb6d904a464fc2c8e'),
  ('KAVUULA', 'aaa8fbe223580342e6b8977aac04de89', '07c202f6ca4640ac0d9ae3d9f5f8d00c69a37d1a0f325f624af1b7e4206ec756'),
  ('KAZINGILIRA', 'aac594be0587e33f30b8dcd3588773b4', '810c354dafdbac191bbfb786a24cd32192ac7ed3be92f6e9ca838e5e5f2e73fe'),
  ('LUVIRI', '7de6eeb93a970e65df3c4e9485ec4c6b', '2dca6ea2e670d68fb6b58fdf1870d277ab7c50475df1d012a81bac18ef2a84d9'),
  ('LUWEREZI', '5900f8a48a300fcbbcf40b9d2c886c26', 'ff2520d8cee6c6ef9aa94d86aab3f2671b673dfa958fcea45d8fd2bff47eb7a0'),
  ('MABIRI', '700895685403c1969d2b6fbef966c891', '5c4210ad33e8ae007391a10d65923414214f5eeec6cdce05bc180ab695378978'),
  ('MACHELECHETE', '9ed2c60b9923a934df239bf52d80d9ec', 'f45522bbd5d14f9058c11006d86633587808e4eec6a1b64985a8f969ef6451fd'),
  ('MANYAMULA', '5c66f0dec8eebba02895377ed97b5b2c', 'ed640f4c0b1f07f64dd4e72064ae7c36a435cc24361dcac781a8706b9c9a989d'),
  ('MHARAUNDA', 'a03a2185de2f51248a9b8a7f265863bf', 'f4710e14d91be9a367b6cbb639d41f6e86f8fedbdff59b47a4a79747a150b0d4'),
  ('MPHONGO', 'aa5aae8bdf9f8def309d7c86e7e7996a', '4b95543a818d76e45c04e36f48c0f0d251116bd657d1916eb3b890febd79f812'),
  ('MZOMA', '14325e74ae7595359d1e20a2ca83526b', 'd0de0be053258fd6651c7ff40b5263d30fad2f0d37e7fc9170228c3050c0ea3b'),
  ('UNYOLO', '8657a4854f41bf0d5cdb5b9709735689', '4176425041e43722f77b7916d595a11375936205f1802259adcbc315999c3de9'),
  ('VAZALA', '2ffe02751c01b9006f2db865d62dcba0', 'fa89266bfee0aaab62f56e5790a96e024b070f68f6490e78e16a6844890999ec'),
  ('VIBANGALALA', 'ce69468213e99c709287bec5b75d3bbb', '3c831725b439ed0e546f1a1d8052415c63a5561e6064d848c1277acd53839415')
ON CONFLICT (name) DO NOTHING;

-- 2. SCHOOLS TABLE
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. LEARNERS TABLE
CREATE TABLE IF NOT EXISTS learners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    lin VARCHAR(16) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F')),
    date_of_birth DATE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT learners_lin_format CHECK (lin ~ '^[0-9]{16}$')
);

-- 4. RESULTS TABLE
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
    term INTEGER NOT NULL CHECK (term BETWEEN 1 AND 3),
    year INTEGER NOT NULL CHECK (year >= 2026),
    class_name VARCHAR(60) NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    total_mark NUMERIC(5, 2) DEFAULT 0.00,
    average_mark NUMERIC(5, 2) DEFAULT 0.00,
    grade VARCHAR(2),
    summary_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_learner_class_year_term UNIQUE (learner_id, class_name, term, year)
);

-- 5. RESULT SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS result_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    ca_mark NUMERIC(5, 2) NOT NULL CHECK (ca_mark BETWEEN 0 AND 40),
    exam_mark NUMERIC(5, 2) NOT NULL CHECK (exam_mark BETWEEN 0 AND 60),
    mark NUMERIC(5, 2) NOT NULL CHECK (mark BETWEEN 0 AND 100),
    grade VARCHAR(2) NOT NULL,
    remarks TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_result_subject UNIQUE (result_id, subject_name)
);

-- 6. RESULT VERSIONS (AUDIT LOG) TABLE
CREATE TABLE IF NOT EXISTS result_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'Zone Officer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL,
    target_table VARCHAR(100),
    target_id UUID,
    details JSONB,
    performed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_zone_name ON schools(zone_id, name);
CREATE INDEX IF NOT EXISTS idx_schools_zone ON schools(zone_id);
CREATE INDEX IF NOT EXISTS idx_learners_school ON learners(school_id);
CREATE INDEX IF NOT EXISTS idx_learners_lin ON learners(lin);
CREATE INDEX IF NOT EXISTS idx_learners_not_deleted ON learners(id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_results_learner_year_term ON results(learner_id, year, term);
CREATE INDEX IF NOT EXISTS idx_results_class_year_term ON results(class_name, year, term);
CREATE INDEX IF NOT EXISTS idx_results_not_deleted ON results(id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_result_subjects_result ON result_subjects(result_id);
CREATE INDEX IF NOT EXISTS idx_result_versions_result ON result_versions(result_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_table, target_id);

-- 10. SERVER-SIDE ZONE PASSWORD VALIDATION FUNCTION
CREATE OR REPLACE FUNCTION validate_zone_password(zone_name TEXT, candidate_password TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  stored_salt TEXT;
  stored_hash TEXT;
BEGIN
  SELECT zone_password_salt, zone_password_hash
  INTO stored_salt, stored_hash
  FROM zones
  WHERE name = zone_name
  LIMIT 1;

  IF stored_salt IS NULL OR stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN encode(digest(stored_salt || candidate_password, 'sha256'), 'hex') = stored_hash;
END;
$$;

-- 11. SERVER-SIDE SECURE REPORT RETRIEVAL FUNCTION
CREATE OR REPLACE FUNCTION fetch_report_card(
  zone_name TEXT,
  school_id UUID,
  class_name TEXT,
  lin TEXT,
  year INTEGER,
  term INTEGER
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  report jsonb;
BEGIN
  SELECT jsonb_build_object(
    'school', sch.name,
    'zone', zn.name,
    'learnerName', concat(ln.first_name, ' ', ln.last_name),
    'lin', ln.lin,
    'class', res.class_name,
    'year', res.year,
    'term', res.term,
    'subjectScores', (
      SELECT jsonb_object_agg(subject_name, jsonb_build_object(
        'ca', ca_mark,
        'exam', exam_mark,
        'total', mark,
        'grade', grade,
        'remarks', coalesce(remarks, '')
      ))
      FROM result_subjects
      WHERE result_id = res.id
    ),
    'summaryData', coalesce(res.summary_data, '{}'::jsonb)
  )
  INTO report
  FROM zones zn
  JOIN schools sch ON sch.zone_id = zn.id
  JOIN learners ln ON ln.school_id = sch.id
  JOIN results res ON res.learner_id = ln.id
  WHERE zn.name = zone_name
    AND sch.id = school_id
    AND ln.lin = lin
    AND res.class_name = class_name
    AND res.year = year
    AND res.term = term
  LIMIT 1;

  RETURN report;
END;
$$;

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES

-- Admins Table Policies
DROP POLICY IF EXISTS "Allow authenticated admin select" ON admins;
CREATE POLICY "Allow authenticated admin select" ON admins
    FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin insert" ON admins;
CREATE POLICY "Allow authenticated admin insert" ON admins
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin update" ON admins;
CREATE POLICY "Allow authenticated admin update" ON admins
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin delete" ON admins;
CREATE POLICY "Allow authenticated admin delete" ON admins
    FOR DELETE USING (auth.role() = 'authenticated');

-- Zones Table Policies
DROP POLICY IF EXISTS "Allow public select zones" ON zones;
CREATE POLICY "Allow public select zones" ON zones
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated admin insert zones" ON zones;
CREATE POLICY "Allow authenticated admin insert zones" ON zones
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin update zones" ON zones;
CREATE POLICY "Allow authenticated admin update zones" ON zones
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin delete zones" ON zones;
CREATE POLICY "Allow authenticated admin delete zones" ON zones
    FOR DELETE USING (auth.role() = 'authenticated');

-- Schools Table Policies
DROP POLICY IF EXISTS "Allow public select schools" ON schools;
CREATE POLICY "Allow public select schools" ON schools
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated admin insert schools" ON schools;
CREATE POLICY "Allow authenticated admin insert schools" ON schools
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin update schools" ON schools;
CREATE POLICY "Allow authenticated admin update schools" ON schools
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin delete schools" ON schools;
CREATE POLICY "Allow authenticated admin delete schools" ON schools
    FOR DELETE USING (auth.role() = 'authenticated');

-- Learners Table Policies
DROP POLICY IF EXISTS "Allow authenticated admin select learners" ON learners;
DROP POLICY IF EXISTS "Allow public select learners" ON learners;
CREATE POLICY "Allow public select learners" ON learners
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated admin insert learners" ON learners;
CREATE POLICY "Allow authenticated admin insert learners" ON learners
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin update learners" ON learners;
CREATE POLICY "Allow authenticated admin update learners" ON learners
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin delete learners" ON learners;
CREATE POLICY "Allow authenticated admin delete learners" ON learners
    FOR DELETE USING (auth.role() = 'authenticated');

-- Results Table Policies
DROP POLICY IF EXISTS "Allow authenticated admin select results" ON results;
DROP POLICY IF EXISTS "Allow public select results" ON results;
CREATE POLICY "Allow public select results" ON results
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated admin insert results" ON results;
CREATE POLICY "Allow authenticated admin insert results" ON results
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin update results" ON results;
CREATE POLICY "Allow authenticated admin update results" ON results
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin delete results" ON results;
CREATE POLICY "Allow authenticated admin delete results" ON results
    FOR DELETE USING (auth.role() = 'authenticated');

-- Result Subjects Table Policies
DROP POLICY IF EXISTS "Allow public select result_subjects" ON result_subjects;
CREATE POLICY "Allow public select result_subjects" ON result_subjects
    FOR SELECT USING (trueult_subjects" ON result_subjects
    FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin insert result_subjects" ON result_subjects;
CREATE POLICY "Allow authenticated admin insert result_subjects" ON result_subjects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin update result_subjects" ON result_subjects;
CREATE POLICY "Allow authenticated admin update result_subjects" ON result_subjects
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin delete result_subjects" ON result_subjects;
CREATE POLICY "Allow authenticated admin delete result_subjects" ON result_subjects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Result Versions Table Policies
DROP POLICY IF EXISTS "Allow authenticated admin select result_versions" ON result_versions;
CREATE POLICY "Allow authenticated admin select result_versions" ON result_versions
    FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin insert result_versions" ON result_versions;
CREATE POLICY "Allow authenticated admin insert result_versions" ON result_versions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin update result_versions" ON result_versions;
CREATE POLICY "Allow authenticated admin update result_versions" ON result_versions
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin delete result_versions" ON result_versions;
CREATE POLICY "Allow authenticated admin delete result_versions" ON result_versions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Settings Table Policies
DROP POLICY IF EXISTS "Allow authenticated admin select settings" ON settings;
CREATE POLICY "Allow authenticated admin select settings" ON settings
    FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin insert settings" ON settings;
CREATE POLICY "Allow authenticated admin insert settings" ON settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin update settings" ON settings;
CREATE POLICY "Allow authenticated admin update settings" ON settings
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin delete settings" ON settings;
CREATE POLICY "Allow authenticated admin delete settings" ON settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Audit Logs Table Policies
DROP POLICY IF EXISTS "Allow authenticated admin select audit_logs" ON audit_logs;
CREATE POLICY "Allow authenticated admin select audit_logs" ON audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin insert audit_logs" ON audit_logs;
CREATE POLICY "Allow authenticated admin insert audit_logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin update audit_logs" ON audit_logs;
CREATE POLICY "Allow authenticated admin update audit_logs" ON audit_logs
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated admin delete audit_logs" ON audit_logs;
CREATE POLICY "Allow authenticated admin delete audit_logs" ON audit_logs
    FOR DELETE USING (auth.role() = 'authenticated');

-- AUDIT LOG TRIGGER FOR RESULTS
CREATE OR REPLACE FUNCTION log_results_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO result_versions (result_id, action, changed_by, old_data, new_data)
        VALUES (
            NEW.id,
            'INSERT',
            COALESCE(auth.jwt() ->> 'email', 'System'),
            NULL,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO result_versions (result_id, action, changed_by, old_data, new_data)
        VALUES (
            NEW.id,
            'UPDATE',
            COALESCE(auth.jwt() ->> 'email', 'System'),
            row_to_json(OLD)::jsonb,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO result_versions (result_id, action, changed_by, old_data, new_data)
        VALUES (
            OLD.id,
            'DELETE',
            COALESCE(auth.jwt() ->> 'email', 'System'),
            row_to_json(OLD)::jsonb,
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_results ON results;
CREATE TRIGGER trigger_audit_results
AFTER INSERT OR UPDATE ON results
FOR EACH ROW EXECUTE FUNCTION log_results_audit();

DROP TRIGGER IF EXISTS trigger_audit_results_before_delete ON results;
CREATE TRIGGER trigger_audit_results_before_delete
BEFORE DELETE ON results
FOR EACH ROW EXECUTE FUNCTION log_results_audit();
