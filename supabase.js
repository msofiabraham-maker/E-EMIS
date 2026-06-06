/**
 * supabase.js - Enhanced Supabase Database Abstraction Layer
 * Centralized database operations with soft-delete support and edit functionality
 * Uses Config system for secure credential management
 */

const ZONE_NAMES = [
  'CHASATO', 'CHIKANGAWA', 'CHIZUNGU', 'EDINGENI', 'EMFENI', 'ENDINDENI', 'EPHANGWENI',
  'KABENA', 'KABUWA', 'KANJUCHI', 'KAPHUTA', 'KAPOLI', 'KATETE', 'KAVUULA', 'KAZINGILIRA',
  'LUVIRI', 'LUWEREZI', 'MABIRI', 'MACHELECHETE', 'MANYAMULA', 'MHARAUNDA', 'MPHONGO',
  'MZOMA', 'UNYOLO', 'VAZALA', 'VIBANGALALA'
];

let supabaseClient = null;

/**
 * Initialize Supabase client with configuration from Config system
 */
function initializeSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const config = Config.getSupabaseConfig();

  if (!config.url || !config.anonKey) {
    console.error('❌ Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return null;
  }

  const { createClient } = window.supabase || {};
  if (typeof createClient !== 'function') {
    console.error('❌ Supabase library not loaded. Ensure supabase-js is included in HTML');
    return null;
  }

  supabaseClient = createClient(config.url, config.anonKey);
  console.log('✓ Supabase client initialized successfully');

  // Initialize realtime after client is ready
  if (typeof Realtime !== 'undefined') {
    Realtime.initialize(supabaseClient).catch((err) => {
      console.warn('Realtime initialization failed:', err);
    });
  }

  return supabaseClient;
}

/**
 * Utility: Normalize text input
 */
function normalizeText(value) {
  return String(value || '').trim();
}

/**
 * Utility: Parse full name into first and last name
 */
function parseFullName(fullName) {
  const parts = normalizeText(fullName).split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' ') || parts[0] || ''
  };
}

/**
 * Utility: Compute grade from average
 */
function computeGradeFromAverage(value) {
  if (value >= 80) return 'A';
  if (value >= 70) return 'B';
  if (value >= 60) return 'C';
  if (value >= 50) return 'D';
  return 'F';
}

/**
 * Utility: Ensure valid term (1, 2, or 3)
 */
function ensureValidTerm(term) {
  const parsedTerm = parseInt(term, 10);
  if (![1, 2, 3].includes(parsedTerm)) {
    throw new Error('Invalid term selected');
  }
  return parsedTerm;
}

/**
 * Get zone by name
 */
async function getZoneByName(zoneName) {
  const client = initializeSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('zones')
    .select('id,name')
    .eq('name', normalizeText(zoneName))
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data || null;
}

/**
 * Initialize database and verify schema
 */
async function initializeDatabase() {
  const client = initializeSupabaseClient();
  if (!client) {
    console.warn('⚠️ Database initialization skipped: Supabase not configured');
    return;
  }

  try {
    const { error } = await client.from('zones').select('id').limit(1);
    if (error) {
      console.warn('⚠️ Unable to access zones table. Confirm schema is deployed.', error);
    } else {
      console.log('✓ Database schema verified');
    }
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

/**
 * EduTrackDB - Main database abstraction layer
 */
const EduTrackDB = {
  /**
   * Sign in admin user
   */
  async signInAdmin(email, password) {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: normalizeText(email).toLowerCase(),
      password
    });

    if (authError) throw authError;

    const userEmail = authData?.user?.email;
    if (!userEmail) throw new Error('Admin authentication failed.');

    const { data: adminData, error: adminError } = await client
      .from('admins')
      .select('id,email,role')
      .eq('email', userEmail)
      .single();

    if (adminError || !adminData) {
      await client.auth.signOut();
      throw new Error('Admin account is not authorized.');
    }

    return adminData;
  },

  /**
   * Sign out admin
   */
  async signOutAdmin() {
    const client = initializeSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
  },

  /**
   * Get all zones
   */
  async getZones() {
    const client = initializeSupabaseClient();

    if (!client) {
      return ZONE_NAMES.map(name => ({ name }));
    }

    try {
      const { data, error } = await client
        .from('zones')
        .select('name')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        return ZONE_NAMES.map(name => ({ name }));
      }

      return data.map(z => ({ name: z.name }));
    } catch (err) {
      console.warn('Failed to load zones from Supabase:', err);
      return ZONE_NAMES.map(name => ({ name }));
    }
  },

  /**
   * Validate zone password
   */
  async validateZonePassword(zoneName, password) {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');
    if (!zoneName || !password) return false;

    const { data, error } = await client.rpc('validate_zone_password', {
      zone_name: normalizeText(zoneName),
      candidate_password: password
    });

    if (error) throw error;
    return data === true;
  },

  /**
   * Get schools by zone
   */
  async getSchoolsByZone(zoneName) {
    const client = initializeSupabaseClient();
    if (!client) return [];

    try {
      const zone = await getZoneByName(zoneName);
      if (!zone) return [];

      const { data, error } = await client
        .from('schools')
        .select('id,name')
        .eq('zone_id', zone.id)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting schools by zone:', error);
      return [];
    }
  },

  /**
   * Add a school
   */
  async addSchool(zoneName, schoolName) {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const zone = await getZoneByName(zoneName);
    if (!zone) throw new Error('Zone not found.');

    const normalizedSchoolName = normalizeText(schoolName);
    if (!normalizedSchoolName) throw new Error('School name is required.');

    // Check for duplicates
    const { data: duplicate, error: duplicateError } = await client
      .from('schools')
      .select('id')
      .eq('zone_id', zone.id)
      .ilike('name', normalizedSchoolName)
      .limit(1);

    if (duplicateError) throw duplicateError;
    if (duplicate?.length > 0) throw new Error('School already exists in this zone.');

    const code = normalizedSchoolName.slice(0, 30).replace(/\s+/g, '_').toUpperCase();
    const { data, error } = await client
      .from('schools')
      .insert([{ zone_id: zone.id, name: normalizedSchoolName, code }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get or create learner (with duplicate prevention)
   */
  async getOrCreateLearner(name, lin, schoolId, gender, dateOfBirth) {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const cleanName = normalizeText(name);
    const cleanLin = normalizeText(lin);
    const parsed = parseFullName(cleanName);

    if (!schoolId) throw new Error('Target school selection is invalid.');
    if (!parsed.first_name || !parsed.last_name) throw new Error('Learner first and last names are required.');
    if (!/^\d{16}$/.test(cleanLin)) throw new Error('LIN must be exactly 16 digits.');
    if (!['M', 'F'].includes(gender)) throw new Error('Gender must be M or F.');
    if (!dateOfBirth) throw new Error('Date of birth is required.');

    // Check for existing learner
    const { data: existing, error: findError } = await client
      .from('learners')
      .select('*')
      .eq('lin', cleanLin)
      .eq('is_deleted', false)
      .limit(1);

    if (findError) throw findError;

    if (existing?.length > 0) {
      const learner = existing[0];
      const existingName = `${learner.first_name} ${learner.last_name}`.trim().toLowerCase();
      if (existingName !== cleanName.toLowerCase()) {
        throw new Error('A learner with this LIN already exists with a different name.');
      }
      return learner;
    }

    // Create new learner
    const { data, error } = await client
      .from('learners')
      .insert([{
        school_id: schoolId,
        lin: cleanLin,
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        gender,
        date_of_birth: dateOfBirth,
        is_deleted: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Save or update results
   */
  async saveResults(learnerId, className, year, term, subjectScores, summaryData) {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const subjectRows = Object.entries(subjectScores).map(([subject, score]) => ({
      subject_name: subject,
      ca_mark: Number(score.ca || 0),
      exam_mark: Number(score.exam || 0),
      mark: Number(score.total || 0),
      grade: score.grade || 'F',
      remarks: score.remarks || ''
    }));

    const totalMark = subjectRows.reduce((acc, row) => acc + row.mark, 0);
    const averageMark = subjectRows.length ? Number((totalMark / subjectRows.length).toFixed(2)) : 0;
    const overallGrade = computeGradeFromAverage(averageMark);
    const academicYear = `${parseInt(year, 10)}/${parseInt(year, 10) + 1}`;
    const validTerm = ensureValidTerm(term);

    // Check for existing result
    const { data: existing, error: existingError } = await client
      .from('results')
      .select('id')
      .eq('learner_id', learnerId)
      .eq('class_name', className)
      .eq('year', parseInt(year, 10))
      .eq('term', validTerm)
      .eq('is_deleted', false)
      .limit(1);

    if (existingError) throw existingError;

    let resultRow;
    if (existing?.length > 0) {
      // Update existing result
      const { data, error } = await client
        .from('results')
        .update({
          total_mark: totalMark,
          average_mark: averageMark,
          grade: overallGrade,
          academic_year: academicYear,
          summary_data: summaryData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing[0].id)
        .select()
        .single();

      if (error) throw error;
      resultRow = data;

      // Delete old subject records
      await client.from('result_subjects').delete().eq('result_id', resultRow.id);
    } else {
      // Create new result
      const { data, error } = await client
        .from('results')
        .insert([{
          learner_id: learnerId,
          class_name: className,
          year: parseInt(year, 10),
          term: validTerm,
          academic_year: academicYear,
          total_mark: totalMark,
          average_mark: averageMark,
          grade: overallGrade,
          summary_data: summaryData,
          is_deleted: false
        }])
        .select()
        .single();

      if (error) throw error;
      resultRow = data;
    }

    if (!resultRow || !resultRow.id) {
      throw new Error('Unable to save results.');
    }

    // Insert subject records
    const { error: subjectError } = await client
      .from('result_subjects')
      .insert(subjectRows.map(subject => ({ ...subject, result_id: resultRow.id })));

    if (subjectError) throw subjectError;

    return resultRow;
  },

  /**
   * Get all learners with zone and school details
   */
  async getAllLearnersWithDetails() {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { data, error } = await client
      .from('learners')
      .select(`
        id,
        first_name,
        last_name,
        lin,
        school_id,
        schools(id, name, zone_id, zones(name))
      `)
      .eq('is_deleted', false)
      .order('first_name', { ascending: true });

    if (error) throw error;

    return data.map(learner => ({
      id: learner.id,
      name: `${learner.first_name} ${learner.last_name}`.trim(),
      lin: learner.lin,
      zone_name: learner.schools?.zones?.name || 'Unknown',
      school_id: learner.school_id,
      school_name: learner.schools?.name || 'Unknown'
    }));
  },

  /**
   * Soft delete a learner
   */
  async deleteLearner(learnerId) {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    // Soft delete learner
    const { error } = await client
      .from('learners')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', learnerId);

    if (error) throw error;

    // Soft delete all associated results
    await client
      .from('results')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('learner_id', learnerId);

    return true;
  },

  /**
   * Get learner results history
   */
  async getLearnerResultsHistory(learnerId) {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { data, error } = await client
      .from('results')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('is_deleted', false)
      .order('year', { ascending: false })
      .order('term', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Soft delete a result record
   */
  async deleteResultRecord(resultId) {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { error } = await client
      .from('results')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', resultId);

    if (error) throw error;
    return true;
  },

  /**
   * Check Supabase connection
   */
  async checkSupabaseConnection() {
    const client = initializeSupabaseClient();
    if (!client) return false;

    try {
      const { data, error } = await client.from('zones').select('id').limit(1);
      if (error) {
        console.warn('Supabase connection check failed', error);
        return false;
      }
      return Array.isArray(data);
    } catch (err) {
      console.error('Supabase connection check exception', err);
      return false;
    }
  },

  /**
   * Find report card
   */
  async findReportCard(zoneName, schoolId, className, lin, year, term) {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const normalizedZone = normalizeText(zoneName);
    const normalizedClassName = normalizeText(className);
    const normalizedLin = normalizeText(lin);
    const parsedYear = parseInt(year, 10);
    const validTerm = ensureValidTerm(term);

    if (!normalizedZone || !schoolId || !normalizedClassName || !normalizedLin || normalizedLin.length !== 16 || !Number.isInteger(parsedYear)) {
      throw new Error('Invalid search parameters provided');
    }

    console.debug('findReportCard: invoking fetch_report_card RPC', {
      zone_name: normalizedZone,
      school_id: schoolId,
      class_name: normalizedClassName,
      lin: normalizedLin,
      year: parsedYear,
      term: validTerm
    });

    try {
      const { data, error } = await client.rpc('fetch_report_card', {
        zone_name: normalizedZone,
        school_id: schoolId,
        class_name: normalizedClassName,
        lin: normalizedLin,
        year: parsedYear,
        term: validTerm
      });

      if (error) {
        throw error;
      }

      if (data) {
        return data;
      }
    } catch (rpcError) {
      console.warn('findReportCard: fetch_report_card RPC failed; performing direct query fallback.', rpcError);
      console.debug('findReportCard: RPC error details', {
        message: rpcError?.message,
        code: rpcError?.code,
        details: rpcError?.details,
        hint: rpcError?.hint,
        status: rpcError?.status
      });
    }

    const { data: learner, error: learnerError } = await client
      .from('learners')
      .select('id, first_name, last_name, lin, school_id')
      .eq('lin', normalizedLin)
      .eq('is_deleted', false)
      .single();

    if (learnerError || !learner) {
      if (learnerError) throw learnerError;
      return null;
    }

    const { data: school, error: schoolError } = await client
      .from('schools')
      .select('id, name, zone_id')
      .eq('id', schoolId)
      .single();

    if (schoolError || !school) {
      if (schoolError) throw schoolError;
      return null;
    }

    const { data: zone, error: zoneError } = await client
      .from('zones')
      .select('name')
      .eq('id', school.zone_id)
      .single();

    if (zoneError || !zone) {
      if (zoneError) throw zoneError;
      return null;
    }

    if (zone.name.toUpperCase() !== normalizedZone.toUpperCase()) {
      console.warn('findReportCard: zone mismatch between selected school and chosen zone', {
        selectedZone: normalizedZone,
        schoolZone: zone.name
      });
      return null;
    }

    const { data: result, error: resultError } = await client
      .from('results')
      .select('id, class_name, year, term, summary_data, result_subjects(*)')
      .eq('learner_id', learner.id)
      .eq('class_name', normalizedClassName)
      .eq('year', parsedYear)
      .eq('term', validTerm)
      .eq('is_deleted', false)
      .single();

    if (resultError || !result) {
      if (resultError) throw resultError;
      return null;
    }

    const subjectScores = (result.result_subjects || []).reduce((acc, subjectRow) => {
      acc[subjectRow.subject_name] = {
        ca: subjectRow.ca_mark,
        exam: subjectRow.exam_mark,
        total: subjectRow.mark,
        grade: subjectRow.grade,
        remarks: subjectRow.remarks || ''
      };
      return acc;
    }, {});

    return {
      school: school.name,
      zone: zone.name,
      learnerName: `${learner.first_name} ${learner.last_name}`.trim(),
      lin: learner.lin,
      class: result.class_name,
      year: result.year,
      term: result.term,
      subjectScores,
      summaryData: result.summary_data || {}
    };
  },

  /**
   * Get specific result for editing
   */
  async getResultForEditing(resultId) {
    const client = initializeSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { data, error } = await client
      .from('results')
      .select(`
        *,
        result_subjects(*)
      `)
      .eq('id', resultId)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;
    return data;
  }
};

// Export for global access
window.EduTrackDB = EduTrackDB;

// Initialize database when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDatabase);
} else {
  initializeDatabase();
}

