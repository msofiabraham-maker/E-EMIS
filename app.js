// app.js

// App State Management
const State = {
  activeAdmin: false,
  adminZone: null,
  allZones: [],
  selectedLearnerForNewResult: null,
  activeWizardStep: 1,
  currentReportCardData: null,
  realtimeListenersConfigured: false,
  lastReportQuery: null
};

// Application Initialization
document.addEventListener("DOMContentLoaded", () => {
  startSplashSequence();
});

function startSplashSequence() {
  const overlay = document.getElementById("splashOverlay");
  const splashDelay = 2200;

  if (!overlay) {
    initApplication();
    return;
  }

  setTimeout(() => {
    overlay.classList.add("hidden");
  }, splashDelay - 500);

  setTimeout(() => {
    overlay.style.display = "none";
    initApplication();
  }, splashDelay);
}

function initApplication() {
  setupKeyboardShortcut();
  populateYearDropdowns();
  loadZones();
  setupRealtimeListeners();
}

/**
 * 1. KEYBOARD LISTENERS & SHORTCUTS
 * Detects Ctrl + Shift + M held for 3 seconds to activate the hidden admin login panel.
 */

/**
 * Generic Message Display Function - Uses Modal System
 */
function showMessage(title, message) {
  const titleEl = document.getElementById("alertTitle");
  const messageEl = document.getElementById("alertMessage");
  
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  
  openModal("alertModal");
}

function setupKeyboardShortcut() {
  let adminShortcutTimer = null;

  const cancelAdminShortcut = () => {
    if (adminShortcutTimer) {
      clearTimeout(adminShortcutTimer);
      adminShortcutTimer = null;
    }
  };

  document.addEventListener("keydown", (e) => {
    const pressedKey = typeof e.key === 'string' ? e.key.toUpperCase() : '';
    if (e.ctrlKey && e.shiftKey && pressedKey === "M") {
      if (!adminShortcutTimer) {
        e.preventDefault();
        adminShortcutTimer = setTimeout(() => {
          openModal("adminLoginModal");
          adminShortcutTimer = null;
        }, 3000);
      }
      return;
    }

    cancelAdminShortcut();
  });

  document.addEventListener("keyup", (e) => {
    const releasedKey = typeof e.key === 'string' ? e.key.toUpperCase() : '';
    if (releasedKey === "M" || !e.ctrlKey || !e.shiftKey) {
      cancelAdminShortcut();
    }
  });
}

/**
 * Dynamically populates Year Dropdowns from 2026 to 2080
 */
function populateYearDropdowns() {
  const userYearSelect = document.getElementById("userYearSelect");
  const adminYearSelect = document.getElementById("adminYearSelect");
  
  if (userYearSelect && adminYearSelect) {
    userYearSelect.innerHTML = '<option value="">-- Select Year --</option>';
    adminYearSelect.innerHTML = '';

    for (let year = 2026; year <= 2080; year++) {
      const opt1 = document.createElement("option");
      opt1.value = year;
      opt1.textContent = year;
      userYearSelect.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = year;
      opt2.textContent = year;
      adminYearSelect.appendChild(opt2);
    }
  }
}

/**
 * 2. MODAL & WINDOW LAYER UTILITIES
 */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("active");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}

/**
 * 3. ZONES & SCHOOLS PIPELINES
 */
async function loadZones() {
  try {
    const zones = await EduTrackDB.getZones();
    State.allZones = zones;

    // Populate user-side selection
    const userSelect = document.getElementById("userZoneSelect");
    userSelect.innerHTML = '<option value="">-- Select Zone --</option>';
    
    zones.forEach(zone => {
      const opt = document.createElement("option");
      opt.value = zone.name;
      opt.textContent = zone.name;
      userSelect.appendChild(opt);
    });

    // Populate admin-side selection modal list
    renderAdminZonesList(zones);
  } catch (error) {
    console.error("Error loading education zones:", error);
  }
}

function renderAdminZonesList(zones) {
  const dropdown = document.getElementById("adminZoneDropdown");
  if (!dropdown) return;
  dropdown.innerHTML = "";
  
  zones.forEach(zone => {
    const opt = document.createElement("option");
    opt.value = zone.name;
    opt.textContent = zone.name;
    dropdown.appendChild(opt);
  });
}

/**
 * Filter Admin zones on input search box
 */
function filterAdminZones() {
  const query = document.getElementById("adminZoneSearchInput").value.toUpperCase();
  const filtered = State.allZones.filter(z => z.name.toUpperCase().includes(query));
  renderAdminZonesList(filtered);
}

/**
 * User selects a zone -> Load corresponding schools
 */
async function handleUserZoneChange() {
  const zoneName = document.getElementById("userZoneSelect").value;
  const schoolSelect = document.getElementById("userSchoolSelect");

  if (!zoneName) {
    schoolSelect.innerHTML = '<option value="">-- Select Zone First --</option>';
    schoolSelect.disabled = true;
    return;
  }

  schoolSelect.innerHTML = '<option value="">-- Loading Schools --</option>';
  schoolSelect.disabled = true;

  try {
    const schools = await EduTrackDB.getSchoolsByZone(zoneName);
    schoolSelect.innerHTML = '<option value="">-- Select School --</option>';
    
    if (schools.length === 0) {
      schoolSelect.innerHTML = '<option value="">No Schools Configured</option>';
    } else {
      schools.forEach(school => {
        const opt = document.createElement("option");
        opt.value = school.id;
        opt.textContent = school.name;
        schoolSelect.appendChild(opt);
      });
      schoolSelect.disabled = false;
    }
  } catch (error) {
    console.error("Error retrieving schools:", error);
    schoolSelect.innerHTML = '<option value="">Error Loading Schools</option>';
  }
}

function handleUserSchoolChange() {
  // Can be used for custom triggers upon school alteration
}

/**
 * 4. ADMIN LOGIN & AUTHENTICATION PROCESS
 */
async function handleAdminLogin(event) {
  event.preventDefault();
  const email = document.getElementById("adminEmailInput").value.trim();
  const password = document.getElementById("adminPasswordInput").value;

  if (!email || !password) {
    showMessage("Missing Credentials", "Please provide your credentials.");
    return;
  }

  try {
    await EduTrackDB.signInAdmin(email, password);
    closeModal("adminLoginModal");
    openModal("adminZoneSelectModal");
  } catch (error) {
    console.error("Admin authentication failed:", error);
    showMessage("Authentication Failed", "Unable to authenticate. Please verify your admin credentials.");
  }
}

/**
 * Proceed from Zone Selection modal -> Prompt password confirmation
 */
function proceedToZonePassword() {
  const dropdown = document.getElementById("adminZoneDropdown");
  const selectedZone = dropdown.value;

  if (!selectedZone) {
    showMessage("Zone Required", "Please select a physical administrative zone to authorize.");
    return;
  }

  State.adminZone = selectedZone;
  closeModal("adminZoneSelectModal");
  document.getElementById("lblTargetValidationZone").textContent = selectedZone;
  document.getElementById("zonePasswordInput").value = "";
  openModal("zonePasswordModal");
}

/**
 * Validates zone password using secure server-side password verification.
 */
async function handleZoneAuth(event) {
  event.preventDefault();
  const password = document.getElementById("zonePasswordInput").value.trim();

  if (!password) {
    showMessage("Password Required", "Please enter the zone password.");
    return;
  }

  try {
    const isValid = await EduTrackDB.validateZonePassword(State.adminZone, password);
    if (isValid) {
      closeModal("zonePasswordModal");
      activateAdminDashboard();
    } else {
      showMessage("Access Denied", "Access denied. The zone password is incorrect.");
    }
  } catch (error) {
    console.error("Zone authentication failed:", error);
    showMessage("Verification Error", "Unable to verify zone password at this time.");
  }
}

/**
 * Shows the main administrative dashboard
 */
function activateAdminDashboard() {
  State.activeAdmin = true;
  document.getElementById("adminBadge").style.display = "flex";
  document.getElementById("activeAdminZone").textContent = State.adminZone;
  document.getElementById("exitAdminBtn").style.display = "inline-block";
  document.getElementById("supabaseStatusBadge").style.display = "inline-flex";
  
  // Hide normal user search interface, show dashboard panel
  document.getElementById("userPortalSection").style.display = "none";
  document.getElementById("adminPortalSection").style.display = "block";
  document.getElementById("schoolManageZoneLabel").textContent = State.adminZone;

  updateSupabaseStatus();
  setupRealtimeListeners();

  // Load contextual data
  switchAdminTab("learnersTab");
  loadAdminSchools();
}

async function updateSupabaseStatus() {
  const statusBadge = document.getElementById('supabaseStatusBadge');
  const statusText = document.getElementById('supabaseStatusText');
  const statusIndicator = document.getElementById('supabaseStatusIndicator');

  if (!statusBadge || !statusText || !statusIndicator) return;

  statusBadge.style.display = 'inline-flex';
  statusText.textContent = 'Checking Supabase...';
  statusIndicator.style.backgroundColor = '#cccccc';

  try {
    const connected = await EduTrackDB.checkSupabaseConnection();
    if (connected) {
      statusText.textContent = '🟢 SUPABASE CONNECTED';
      statusIndicator.style.backgroundColor = '#23b44b';
    } else {
      statusText.textContent = '🔴 SUPABASE CONNECTION FAILED';
      statusIndicator.style.backgroundColor = '#f44336';
    }
  } catch (err) {
    console.error('updateSupabaseStatus: failed to verify Supabase connection', err);
    statusText.textContent = '🔴 SUPABASE CONNECTION FAILED';
    statusIndicator.style.backgroundColor = '#f44336';
  }
}

/**
 * Exits the administrative interface safely
 */
function logoutAdmin() {
  State.activeAdmin = false;
  State.adminZone = null;
  
  document.getElementById("adminBadge").style.display = "none";
  document.getElementById("supabaseStatusBadge").style.display = "none";
  document.getElementById("exitAdminBtn").style.display = "none";
  document.getElementById("adminPortalSection").style.display = "none";
  document.getElementById("userPortalSection").style.display = "block";
  
  // Clean up realtime listeners
  if (typeof Realtime !== 'undefined') {
    Realtime.cleanup();
  }
  State.realtimeListenersConfigured = false;
  State.lastReportQuery = null;
  
  // Reset forms
  document.getElementById("adminLoginForm").reset();
  document.getElementById("zonePasswordForm").reset();
  location.reload();
}

/**
 * Admin Switch Tab
 */
function switchAdminTab(tabId) {
  document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
  document.querySelectorAll(".dashboard-navigation .tab-btn").forEach(btn => btn.classList.remove("active"));
  
  document.getElementById(tabId).classList.add("active");
  
  // Highlight correct tab button
  const buttons = document.querySelectorAll(".dashboard-navigation .tab-btn");
  if (tabId === "learnersTab") {
    buttons[0].classList.add("active");
    loadAllLearners();
  } else if (tabId === "addResultsTab") {
    buttons[1].classList.add("active");
    resetWizard();
  } else if (tabId === "manageSchoolsTab") {
    buttons[2].classList.add("active");
    loadAdminSchools();
  }
}

/**
 * 5. ADMIN MANAGE SCHOOLS MODULE
 */
async function loadAdminSchools() {
  if (!State.adminZone) return;
  try {
    const schools = await EduTrackDB.getSchoolsByZone(State.adminZone);
    const tbody = document.getElementById("schoolsListTableBody");
    tbody.innerHTML = "";

    // Also populate wizard select options
    const wizardSchoolSelect = document.getElementById("adminSchoolSelect");
    wizardSchoolSelect.innerHTML = '<option value="">-- Select Target School --</option>';

    if (schools.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: var(--glass-text-muted);">No schools registered in this zone yet.</td></tr>';
      return;
    }

    schools.forEach(school => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${school.name}</strong></td>
        <td><span style="color: var(--malawi-green); font-weight: 600;">${State.adminZone}</span></td>
      `;
      tbody.appendChild(tr);

      const opt = document.createElement("option");
      opt.value = school.id;
      opt.textContent = school.name;
      wizardSchoolSelect.appendChild(opt);
    });
  } catch (error) {
    console.error("Error loading schools list:", error);
  }
}

async function handleCreateSchool(event) {
  event.preventDefault();
  const schoolName = document.getElementById("newSchoolNameInput").value.trim();

  if (!schoolName) return;

  try {
    await EduTrackDB.addSchool(State.adminZone, schoolName);
    showMessage("Success", "School successfully saved & verified.");
    document.getElementById("newSchoolNameInput").value = "";
    loadAdminSchools();
  } catch (error) {
    showMessage("Error", error.message || "Failed to persist school record.");
  }
}

/**
 * 6. ADMIN VIEW & SEARCH LEARNERS MODULE
 */
let localLearnersCache = [];

async function loadAllLearners() {
  try {
    const learners = await EduTrackDB.getAllLearnersWithDetails();
    // Filter to show only learners in the currently authorized admin zone
    localLearnersCache = learners.filter(l => l.zone_name.toUpperCase() === State.adminZone.toUpperCase());
    renderLearnersTable(localLearnersCache);
  } catch (error) {
    console.error("Error retrieving learner records:", error);
  }
}

/**
 * Set up realtime listeners for automatic refreshes
 */
function setupRealtimeListeners() {
  if (typeof Realtime === 'undefined') return;
  if (State.realtimeListenersConfigured) return;

  // Listen for learners table changes
  Realtime.addEventListener('learners_changed', () => {
    console.log('Realtime event: learners_changed');
    if (State.activeAdmin && document.getElementById('learnersTab').classList.contains('active')) {
      console.log('Realtime handler: reloading learner list.');
      loadAllLearners();
    }
  });

  // Listen for results table changes
  Realtime.addEventListener('results_changed', () => {
    console.log('Realtime event: results_changed');
    if (State.activeAdmin && document.getElementById('addResultsTab').classList.contains('active')) {
      console.log('Realtime handler: add results tab active, refreshing admin school list and learners.');
      loadAdminSchools();
      loadAllLearners();
    }
    refreshVisibleReportCard('results');
  });

  // Listen for result subjects table changes
  Realtime.addEventListener('result_subjects_changed', () => {
    console.log('Realtime event: result_subjects_changed');
    refreshVisibleReportCard('result_subjects');
  });

  // Listen for schools table changes
  Realtime.addEventListener('schools_changed', () => {
    console.log('Realtime event: schools_changed');
    if (State.activeAdmin) {
      loadAdminSchools();
    }
    loadZones();
  });

  State.realtimeListenersConfigured = true;
  console.log('✓ Realtime listeners configured');
}

async function refreshVisibleReportCard(source) {
  const resultsArea = document.getElementById('resultsRenderArea');
  if (!resultsArea || resultsArea.style.display === 'none') return;
  if (!State.lastReportQuery) return;

  console.log(`Realtime refresh triggered by ${source}. Reloading visible report card from last query.`);

  try {
    const { zone, schoolId, className, lin, year, term } = State.lastReportQuery;
    const reportCard = await EduTrackDB.findReportCard(zone, schoolId, className, lin, year, term);

    if (reportCard) {
      State.currentReportCardData = reportCard;
      renderReportCardToUI(reportCard);
      console.log('Realtime refresh: report card UI updated successfully.');
    }
  } catch (error) {
    console.error('Realtime refresh error:', error);
  }
}

function renderLearnersTable(list) {
  const tbody = document.getElementById("learnersTableBody");
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--glass-text-muted);">No learners match current index.</td></tr>';
    return;
  }

  list.forEach(learner => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${learner.name}</strong></td>
      <td style="font-family: monospace;">${learner.lin}</td>
      <td><span style="font-size: 0.85rem; background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">${learner.zone_name}</span></td>
      <td>${learner.school_name}</td>
      <td>
        <button class="action-badge badge-add" onclick="triggerWizardForLearner('${learner.id}', '${learner.name}', '${learner.lin}', '${learner.school_id}')">+ Results</button>
        <button class="action-badge badge-delete" onclick="handleDeleteLearner('${learner.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterLearnersTable() {
  const query = document.getElementById("learnerSearchInput").value.toLowerCase();
  const filtered = localLearnersCache.filter(l => 
    l.name.toLowerCase().includes(query) || 
    l.lin.includes(query)
  );
  renderLearnersTable(filtered);
}

async function handleDeleteLearner(id) {
  if (confirm("Are you sure you want to permanently delete this student record? This action deletes ALL historical term results!")) {
    try {
      await EduTrackDB.deleteLearner(id);
      showMessage("Deleted", "Learner record successfully deleted.");
      loadAllLearners();
    } catch (error) {
      showMessage("Error", "Error deleting record.");
    }
  }
}

/**
 * Trigger Wizard for a specific learner to ADD NEW TERM / YEAR results without duplications.
 */
function triggerWizardForLearner(id, name, lin, schoolId) {
  State.selectedLearnerForNewResult = { id, name, lin, schoolId };
  switchAdminTab("addResultsTab");
  
  // Autofill and lock step 3 and focus on school matching
  document.getElementById("adminSchoolSelect").value = schoolId;
  document.getElementById("adminLearnerName").value = name;
  document.getElementById("adminLearnerName").disabled = true;
  document.getElementById("adminLearnerLin").value = lin;
  document.getElementById("adminLearnerLin").disabled = true;
}

/**
 * 7. THE REPORT CARD MATRIX WIZARD (ADMIN TAB 2)
 */
function resetWizard() {
  State.activeWizardStep = 1;
  if (!State.selectedLearnerForNewResult) {
    document.getElementById("adminLearnerName").value = "";
    document.getElementById("adminLearnerName").disabled = false;
    document.getElementById("adminLearnerLin").value = "";
    document.getElementById("adminLearnerLin").disabled = false;
  }
  
  // Clear Matrix Input fields
  document.querySelectorAll(".score-input").forEach(inp => {
    if (!inp.readOnly) inp.value = "";
    else if (inp.classList.contains("total-score") || inp.classList.contains("grade-score")) inp.value = "";
  });
  document.querySelectorAll(".remarks-score").forEach(inp => inp.value = "");
  
  document.getElementById("adminClassPosition").value = "";
  document.getElementById("adminTotalPupils").value = "";
  document.getElementById("adminClassTeacherComment").value = "";
  document.getElementById("adminHeadTeacherComment").value = "";
  document.getElementById("adminPromotionStatus").value = "N/A";

  goToStep(1);
}

function goToStep(step) {
  State.activeWizardStep = step;
  document.querySelectorAll(".wizard-steps").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".wizard-step-dot").forEach(el => el.classList.remove("active"));

  document.getElementById(`wizardStep${step}`).classList.add("active");
  for (let i = 1; i <= step; i++) {
    document.getElementById(`dot${i}`).classList.add("active");
  }
}

function proceedToStep2() {
  const schoolId = document.getElementById("adminSchoolSelect").value;
  if (!schoolId) {
    showMessage("School Required", "Please select a target School to proceed.");
    return;
  }
  
  // Set summary labels in step 3 confirmation panel
  const year = document.getElementById("adminYearSelect").value;
  const term = document.getElementById("adminTermSelect").value;
  document.getElementById("labelConfirmedYear").textContent = year;
  document.getElementById("labelConfirmedTerm").textContent = term;

  goToStep(2);
}

function proceedToStep3() {
  goToStep(3);
}

/**
 * Live Excel Matrix calculation triggers
 */
function calculateRow(inputElement) {
  const tr = inputElement.closest("tr");
  const caInput = tr.querySelector(".ca-score");
  const examInput = tr.querySelector(".exam-score");
  const totalInput = tr.querySelector(".total-score");
  const gradeInput = tr.querySelector(".grade-score");

  let ca = parseFloat(caInput.value) || 0;
  let exam = parseFloat(examInput.value) || 0;

  // Validation boundaries
  if (ca > 40) {
    ca = 40;
    caInput.value = 40;
  }
  if (exam > 60) {
    exam = 60;
    examInput.value = 60;
  }

  const total = ca + exam;
  totalInput.value = total;

  // Compute standard Malawian performance grades
  let grade = "F";
  if (total >= 80) grade = "A";
  else if (total >= 70) grade = "B";
  else if (total >= 60) grade = "C";
  else if (total >= 50) grade = "D";

  gradeInput.value = grade;
}

/**
 * Extract entire filled subject matrices from DOM
 */
function compileSubjectScores() {
  const scores = {};
  const rows = document.querySelectorAll("#matrixTableBody tr");
  
  rows.forEach(tr => {
    const subject = tr.getAttribute("data-subject");
    const ca = parseFloat(tr.querySelector(".ca-score").value) || 0;
    const exam = parseFloat(tr.querySelector(".exam-score").value) || 0;
    const total = parseFloat(tr.querySelector(".total-score").value) || 0;
    const grade = tr.querySelector(".grade-score").value || "F";
    const remarks = tr.querySelector(".remarks-score").value.trim();

    scores[subject] = { ca, exam, total, grade, remarks };
  });

  return scores;
}

/**
 * Convert term name to numeric value
 */
function parseTermValue(termString) {
  if (!termString) return null;
  if (termString === "Term One") return 1;
  if (termString === "Term Two") return 2;
  if (termString === "Term Three") return 3;
  return null;
}

function getNumericTerm(termString) {
  const fallbackTerm = parseInt(termString, 10);
  if ([1, 2, 3].includes(fallbackTerm)) return fallbackTerm;
  return parseTermValue(termString);
}

function isValidTerm(term) {
  return [1, 2, 3].includes(term);
}

function validateReportCardData() {
  const rows = Array.from(document.querySelectorAll("#matrixTableBody tr"));
  let hasScoreEntry = false;

  for (const tr of rows) {
    const caField = tr.querySelector(".ca-score");
    const examField = tr.querySelector(".exam-score");
    const totalField = tr.querySelector(".total-score");

    const caValue = caField?.value.trim();
    const examValue = examField?.value.trim();
    const totalValue = totalField?.value.trim();

    if (caValue !== "" || examValue !== "") {
      hasScoreEntry = true;
    }

    if (caValue !== "") {
      const ca = Number(caValue);
      if (!Number.isFinite(ca) || ca < 0 || ca > 40) return false;
    }

    if (examValue !== "") {
      const exam = Number(examValue);
      if (!Number.isFinite(exam) || exam < 0 || exam > 60) return false;
    }

    if (totalValue !== "") {
      const total = Number(totalValue);
      if (!Number.isFinite(total) || total < 0 || total > 100) return false;
    }
  }

  return hasScoreEntry;
}

/**
 * UPLOAD AND SAVE ENGINE
 */
async function uploadAndSaveReportCard() {
  const name = document.getElementById("adminLearnerName").value.trim();
  const lin = document.getElementById("adminLearnerLin").value.trim();
  const schoolId = document.getElementById("adminSchoolSelect").value;

  if (!name || lin.length !== 16 || !/^\d+$/.test(lin)) {
    showMessage("Invalid Input", "Please ensure the student Name is provided, and the LIN is exactly 16 numerical digits.");
    return;
  }

  const className = document.getElementById("adminClassSelect").value;
  const year = document.getElementById("adminYearSelect").value;
  const termString = document.getElementById("adminTermSelect").value;
  const gender = document.getElementById("adminLearnerGender").value;
  const dateOfBirth = document.getElementById("adminLearnerDob").value;

  if (!State.adminZone) {
    showMessage("Invalid Zone", "Please authorize a valid administration zone before saving.");
    return;
  }

  if (!schoolId) {
    showMessage("School Required", "Please select a target School to proceed.");
    return;
  }

  if (!className) {
    showMessage("Class Required", "Please select a class for this result.");
    return;
  }

  if (!year) {
    showMessage("Year Required", "Please select an academic year.");
    return;
  }

  if (!gender || !dateOfBirth) {
    showMessage("Missing Information", "Please provide the learner's gender and date of birth.");
    return;
  }

  // Validate and parse term
  const term = getNumericTerm(termString);
  if (!isValidTerm(term)) {
    showMessage("Invalid Term", "Please select a valid term.");
    return;
  }

  if (!validateReportCardData()) {
    showMessage("Invalid Report Card", "Please enter valid report card scores before saving.");
    return;
  }

  // Subject JSON Data Compilation
  const subjectScores = compileSubjectScores();

  // Summary Metrics Data Compilation
  const summaryData = {
    position: document.getElementById("adminClassPosition").value.trim() || "N/A",
    totalPupils: document.getElementById("adminTotalPupils").value.trim() || "N/A",
    classTeacherComment: document.getElementById("adminClassTeacherComment").value.trim() || "No notes provided.",
    headTeacherComment: document.getElementById("adminHeadTeacherComment").value.trim() || "No notes provided.",
    promotionStatus: document.getElementById("adminPromotionStatus").value
  };

  console.debug('uploadAndSaveReportCard: saving learner and result', {
    name,
    lin,
    schoolId,
    className,
    year,
    term,
    gender,
    dateOfBirth,
    subjectScores,
    summaryData
  });

  try {
    // 1. Check/Save Student profile (Enforces duplication check rule: Same Name and LIN)
    const student = await EduTrackDB.getOrCreateLearner(name, lin, schoolId, gender, dateOfBirth);
    console.debug('uploadAndSaveReportCard: learner record returned', student);
    
    // 2. Persist student term report details
    const result = await EduTrackDB.saveResults(student.id, className, year, term, subjectScores, summaryData);
    console.debug('uploadAndSaveReportCard: result record saved', result);

    showMessage("Success", "Results Saved Successfully");
    await loadAllLearners();

    // Reset state parameters and return
    State.selectedLearnerForNewResult = null;
    switchAdminTab("learnersTab");
  } catch (error) {
    showMessage("Error", error.message || "An error occurred while uploading. Please check inputs.");
  }
}

/**
 * 8. PUBLIC SEARCH & RESULT RETRIEVAL PIPELINE
 */
async function handleRetrieveReport(event) {
  event.preventDefault();

  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || 'View Results';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Retrieving Results...';
  }

  const zone = document.getElementById("userZoneSelect").value;
  const schoolId = document.getElementById("userSchoolSelect").value;
  const className = document.getElementById("userClassSelect").value;
  const rawLin = document.getElementById("userLinInput").value || '';
  const lin = rawLin.replace(/\D/g, '').trim();
  const year = document.getElementById("userYearSelect").value;
  const termString = document.getElementById("userTermSelect").value;

  if (!zone || !schoolId || !className || !year || !termString) {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
    showMessage("Complete Form", "Please fill in all search fields before retrieving a report.");
    return;
  }

  if (!/^\d{16}$/.test(lin)) {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
    showMessage("Invalid LIN", "Please enter a valid 16-digit learner identification number (digits only).");
    return;
  }

  const term = getNumericTerm(termString);
  if (!isValidTerm(term)) {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
    showMessage("Invalid Term", "Please select a valid term.");
    return;
  }

  try {
    console.debug('Retrieval search values', {
      zone,
      schoolId,
      className,
      lin,
      year,
      term,
      termString
    });

    State.lastReportQuery = { zone, schoolId, className, lin, year, term };
    const reportCard = await EduTrackDB.findReportCard(zone, schoolId, className, lin, year, term);

    if (!reportCard) {
      console.warn('Retrieval failed: no matching report card returned for search criteria.', {
        zone,
        schoolId,
        className,
        lin,
        year,
        term
      });
      showMessage(
        "No Results Found",
        "We could not find a result card for the selected school, class, year, term, and LIN. Please verify your entries and try again."
      );
      return;
    }

    console.debug('Retrieval succeeded: report card found', reportCard);
    State.currentReportCardData = reportCard;
    renderReportCardToUI(reportCard);
  } catch (error) {
    console.error("Retrieval error:", error, error?.message, error?.details || error?.hint || error?.code);
    const message = /network|connect|timeout|failed/i.test(error.message || '')
      ? "Unable to connect to results server. Please try again."
      : "Unable to retrieve results. Please verify your search details and try again.";
    showMessage("Unable to retrieve results", message);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

/**
 * Displays academic record template to screen & hides main search
 */
function renderReportCardToUI(report) {
  document.getElementById("rcLearnerName").textContent = report.learnerName;
  document.getElementById("rcLearnerLin").textContent = report.lin;
  document.getElementById("rcZone").textContent = report.zone;
  document.getElementById("rcSchool").textContent = report.school;
  document.getElementById("rcClass").textContent = report.class;
  document.getElementById("rcYearTerm").textContent = `${report.year} - ${report.term}`;

  // Subject table renderer
  const tbody = document.getElementById("rcSubjectsBody");
  tbody.innerHTML = "";

  let aggregateTotal = 0;
  let count = 0;

  for (const [subject, data] of Object.entries(report.subjectScores)) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:700;">${subject}</td>
      <td style="text-align: center;">${data.ca}</td>
      <td style="text-align: center;">${data.exam}</td>
      <td style="text-align: center; font-weight:700;">${data.total}</td>
      <td style="text-align: center; font-weight:700;">${data.grade}</td>
      <td>${data.remarks || "-"}</td>
    `;
    tbody.appendChild(tr);

    aggregateTotal += data.total;
    count++;
  }

  // Aggregate mathematics calculation
  const maxPossible = count * 100;
  const percentage = maxPossible > 0 ? ((aggregateTotal / maxPossible) * 100).toFixed(1) : "0.0";

  document.getElementById("rcTotalMarks").textContent = `${aggregateTotal} / ${maxPossible}`;
  document.getElementById("rcMeanPercentage").textContent = `${percentage}%`;
  document.getElementById("rcPosition").textContent = `${report.summaryData.position} of ${report.summaryData.totalPupils}`;
  document.getElementById("rcPromotion").textContent = report.summaryData.promotionStatus;

  document.getElementById("rcClassTeacherComment").textContent = report.summaryData.classTeacherComment;
  document.getElementById("rcHeadTeacherComment").textContent = report.summaryData.headTeacherComment;

  // Toggle View panels
  document.getElementById("userPortalSection").style.display = "none";
  if (State.activeAdmin) {
    document.getElementById("adminPortalSection").style.display = "none";
  }
  document.getElementById("resultsRenderArea").style.display = "block";
}

function closeReportCardView() {
  document.getElementById("resultsRenderArea").style.display = "none";
  
  if (State.activeAdmin) {
    document.getElementById("adminPortalSection").style.display = "block";
  } else {
    document.getElementById("userPortalSection").style.display = "block";
  }
}