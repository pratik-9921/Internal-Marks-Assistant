/**
 * storage.js
 * localStorage Management Module
 * Manages student profiles, individual elective tracks, entered marks, and faculty demo records.
 * Note: Uses browser localStorage for local demonstration purposes only.
 */

const STORAGE_KEYS = {
  CURRENT_STUDENT: "snjb_current_student_profile",
  FACULTY_ROSTER: "snjb_faculty_demo_roster",
  ACTIVE_ROLL: "snjb_active_student_roll"
};

/**
 * Creates default initial student profiles with distinct elective tracks
 */
function createDefaultStudentProfile(name = "Aarav Patil", rollNo = "TY-COMP-01") {
  return {
    rollNo: rollNo,
    name: name,
    semester: "V",
    academicYear: "2026-27",
    // Selected elective tracks
    selectedPec1Id: "pec-ai",         // Track C: Artificial Intelligence
    selectedMdm3Id: "mdm-civil",      // Civil: Water and Land Management
    selectedOe2Id: "oe-digital-mktg", // Digital Marketing
    // Marks map: null = pending/unentered, number = entered valid score
    marks: {
      "pcc-automata": { cie: 16, mse: 15, see: null, tw: null, pr: null, or: null },
      "pcc-network": { cie: 17, mse: 16, see: null, tw: null, pr: null, or: null },
      "pcc-network-lab": { cie: null, mse: null, see: null, tw: 22, pr: null, or: 21 },
      "vec-evs": { cie: 18, mse: null, see: null, tw: null, pr: null, or: null },
      // PEC-I (Theory & Lab)
      "pec-ai": { cie: 18, mse: 17, see: null, tw: null, pr: null, or: null },
      "pec-ai-lab": { cie: null, mse: null, see: null, tw: 44, pr: 42, or: null },
      // MDM-III (Theory & Lab)
      "mdm-civil": { cie: 16, mse: null, see: null, tw: null, pr: null, or: null },
      "mdm-civil-lab": { cie: null, mse: null, see: null, tw: 22, pr: 21, or: null },
      // OE-II
      "oe-digital-mktg": { cie: 15, mse: null, see: null, tw: null, pr: null, or: null }
    }
  };
}

/**
 * Generates initial demo roster containing diverse elective tracks
 */
function getInitialDemoRoster() {
  return [
    createDefaultStudentProfile("Aarav Patil", "TY-COMP-01"),
    {
      rollNo: "TY-COMP-02",
      name: "Sneha Deshmukh",
      semester: "V",
      academicYear: "2026-27",
      selectedPec1Id: "pec-cyber",
      selectedMdm3Id: "mdm-etc-drone",
      selectedOe2Id: "oe-agronics",
      marks: {
        "pcc-automata": { cie: 18, mse: 19, see: null, tw: null, pr: null, or: null },
        "pcc-network": { cie: 19, mse: 18, see: null, tw: null, pr: null, or: null },
        "pcc-network-lab": { cie: null, mse: null, see: null, tw: 24, pr: null, or: 23 },
        "vec-evs": { cie: 19, mse: null, see: null, tw: null, pr: null, or: null },
        "pec-cyber": { cie: 19, mse: 18, see: null, tw: null, pr: null, or: null },
        "pec-cyber-lab": { cie: null, mse: null, see: null, tw: 47, pr: 48, or: null },
        "mdm-etc-drone": { cie: 18, mse: null, see: null, tw: null, pr: null, or: null },
        "mdm-etc-drone-lab": { cie: null, mse: null, see: null, tw: 23, pr: 24, or: null },
        "oe-agronics": { cie: 18, mse: null, see: null, tw: null, pr: null, or: null }
      }
    },
    {
      rollNo: "TY-COMP-03",
      name: "Rohan Kulkarni",
      semester: "V",
      academicYear: "2026-27",
      selectedPec1Id: "pec-web",
      selectedMdm3Id: "mdm-mech",
      selectedOe2Id: "oe-sustainable-energy",
      marks: {
        "pcc-automata": { cie: 12, mse: 10, see: null, tw: null, pr: null, or: null },
        "pcc-network": { cie: 13, mse: 11, see: null, tw: null, pr: null, or: null },
        "pcc-network-lab": { cie: null, mse: null, see: null, tw: 18, pr: null, or: 17 },
        "vec-evs": { cie: 14, mse: null, see: null, tw: null, pr: null, or: null },
        "pec-web": { cie: 14, mse: 12, see: null, tw: null, pr: null, or: null },
        "pec-web-lab": { cie: null, mse: null, see: null, tw: 35, pr: 36, or: null },
        "mdm-mech": { cie: 12, mse: null, see: null, tw: null, pr: null, or: null },
        "mdm-mech-lab": { cie: null, mse: null, see: null, tw: 18, pr: 17, or: null },
        "oe-sustainable-energy": { cie: 11, mse: null, see: null, tw: null, pr: null, or: null }
      }
    },
    {
      rollNo: "TY-COMP-04",
      name: "Pooja Shinde",
      semester: "V",
      academicYear: "2026-27",
      selectedPec1Id: "pec-cg",
      selectedMdm3Id: "mdm-etc-lean",
      selectedOe2Id: "oe-circular-economy",
      marks: {
        "pcc-automata": { cie: 15, mse: 14, see: null, tw: null, pr: null, or: null },
        "pcc-network": { cie: 16, mse: 15, see: null, tw: null, pr: null, or: null },
        "pcc-network-lab": { cie: null, mse: null, see: null, tw: 21, pr: null, or: 20 },
        "vec-evs": { cie: 17, mse: null, see: null, tw: null, pr: null, or: null },
        "pec-cg": { cie: 17, mse: 16, see: null, tw: null, pr: null, or: null },
        "pec-cg-lab": { cie: null, mse: null, see: null, tw: 42, pr: 41, or: null },
        "mdm-etc-lean": { cie: 15, mse: null, see: null, tw: null, pr: null, or: null },
        "mdm-etc-lean-lab": { cie: null, mse: null, see: null, tw: 20, pr: 22, or: null },
        "oe-circular-economy": { cie: 16, mse: null, see: null, tw: null, pr: null, or: null }
      }
    },
    {
      rollNo: "TY-COMP-05",
      name: "Aditya Joshi",
      semester: "V",
      academicYear: "2026-27",
      selectedPec1Id: "pec-ai",
      selectedMdm3Id: "mdm-civil",
      selectedOe2Id: "oe-costing",
      marks: {
        "pcc-automata": { cie: 14, mse: 12, see: null, tw: null, pr: null, or: null },
        "pcc-network": { cie: 15, mse: 14, see: null, tw: null, pr: null, or: null },
        "pcc-network-lab": { cie: null, mse: null, see: null, tw: 20, pr: null, or: 19 },
        "vec-evs": { cie: 16, mse: null, see: null, tw: null, pr: null, or: null },
        "pec-ai": { cie: 15, mse: 13, see: null, tw: null, pr: null, or: null },
        "pec-ai-lab": { cie: null, mse: null, see: null, tw: 40, pr: 38, or: null },
        "mdm-civil": { cie: 14, mse: null, see: null, tw: null, pr: null, or: null },
        "mdm-civil-lab": { cie: null, mse: null, see: null, tw: 19, pr: 18, or: null },
        "oe-costing": { cie: 14, mse: null, see: null, tw: null, pr: null, or: null }
      }
    },
    {
      rollNo: "TY-COMP-06",
      name: "Neha Chaudhari",
      semester: "V",
      academicYear: "2026-27",
      selectedPec1Id: "pec-pervasive",
      selectedMdm3Id: "mdm-etc-drone",
      selectedOe2Id: "oe-digital-mktg",
      marks: {
        "pcc-automata": { cie: 17, mse: 16, see: null, tw: null, pr: null, or: null },
        "pcc-network": { cie: 18, mse: 17, see: null, tw: null, pr: null, or: null },
        "pcc-network-lab": { cie: null, mse: null, see: null, tw: 23, pr: null, or: 22 },
        "vec-evs": { cie: 18, mse: null, see: null, tw: null, pr: null, or: null },
        "pec-pervasive": { cie: 18, mse: 17, see: null, tw: null, pr: null, or: null },
        "pec-pervasive-lab": { cie: null, mse: null, see: null, tw: 46, pr: 45, or: null },
        "mdm-etc-drone": { cie: 17, mse: null, see: null, tw: null, pr: null, or: null },
        "mdm-etc-drone-lab": { cie: null, mse: null, see: null, tw: 22, pr: 23, or: null },
        "oe-digital-mktg": { cie: 17, mse: null, see: null, tw: null, pr: null, or: null }
      }
    },
    {
      rollNo: "TY-COMP-07",
      name: "Saurabh More",
      semester: "V",
      academicYear: "2026-27",
      selectedPec1Id: "pec-cyber",
      selectedMdm3Id: "mdm-mech",
      selectedOe2Id: "oe-circular-economy",
      marks: {
        "pcc-automata": { cie: 10, mse: 8, see: null, tw: null, pr: null, or: null },
        "pcc-network": { cie: 11, mse: 9, see: null, tw: null, pr: null, or: null },
        "pcc-network-lab": { cie: null, mse: null, see: null, tw: 16, pr: null, or: 15 },
        "vec-evs": { cie: 13, mse: null, see: null, tw: null, pr: null, or: null },
        "pec-cyber": { cie: 12, mse: 10, see: null, tw: null, pr: null, or: null },
        "pec-cyber-lab": { cie: null, mse: null, see: null, tw: 32, pr: 30, or: null },
        "mdm-mech": { cie: 11, mse: null, see: null, tw: null, pr: null, or: null },
        "mdm-mech-lab": { cie: null, mse: null, see: null, tw: 16, pr: 15, or: null },
        "oe-circular-economy": { cie: 10, mse: null, see: null, tw: null, pr: null, or: null }
      }
    },
    {
      rollNo: "TY-COMP-08",
      name: "Tanvi Wagh",
      semester: "V",
      academicYear: "2026-27",
      selectedPec1Id: "pec-web",
      selectedMdm3Id: "mdm-etc-lean",
      selectedOe2Id: "oe-sustainable-energy",
      marks: {
        "pcc-automata": { cie: 16, mse: 15, see: null, tw: null, pr: null, or: null },
        "pcc-network": { cie: 16, mse: 16, see: null, tw: null, pr: null, or: null },
        "pcc-network-lab": { cie: null, mse: null, see: null, tw: 22, pr: null, or: 21 },
        "vec-evs": { cie: 17, mse: null, see: null, tw: null, pr: null, or: null },
        "pec-web": { cie: 16, mse: 15, see: null, tw: null, pr: null, or: null },
        "pec-web-lab": { cie: null, mse: null, see: null, tw: 41, pr: 40, or: null },
        "mdm-etc-lean": { cie: 16, mse: null, see: null, tw: null, pr: null, or: null },
        "mdm-etc-lean-lab": { cie: null, mse: null, see: null, tw: 21, pr: 22, or: null },
        "oe-sustainable-energy": { cie: 15, mse: null, see: null, tw: null, pr: null, or: null }
      }
    }
  ];
}

/**
 * Resolves the full list of 9 active courses applicable to a specific student's elective choices.
 */
function resolveStudentCourses(profile, syllabusData) {
  let data = syllabusData
    || (typeof window !== "undefined" && window.SyllabusData ? window.SyllabusData : null);

  if (!data && typeof require !== "undefined") {
    try {
      data = require("./data/syllabus-data.js");
    } catch (e) { }
  }

  if (!data || !data.CORE_COURSES) return [];

  const core = data.CORE_COURSES;
  const pec = (data.PEC_1_BASKET && data.PEC_1_BASKET.find(item => item.id === profile.selectedPec1Id))
    || data.PEC_1_BASKET[0];
  const mdm = (data.MDM_3_BASKET && data.MDM_3_BASKET.find(item => item.id === profile.selectedMdm3Id))
    || data.MDM_3_BASKET[0];
  const oe = (data.OE_2_BASKET && data.OE_2_BASKET.find(item => item.id === profile.selectedOe2Id))
    || data.OE_2_BASKET[0];

  return [
    core[0], // Automata Theory
    core[1], // Computer Network
    { id: pec.id, ...pec.theory, isElective: true, trackType: "PEC-I Theory" },
    { id: mdm.id, ...mdm.theory, isElective: true, trackType: "MDM-III Theory" },
    { id: oe.id, ...oe, isElective: true, trackType: "OE-II Theory" },
    core[2], // Computer Network Lab
    { id: `${pec.id}-lab`, ...pec.lab, isElective: true, trackType: "PEC-I Lab" },
    { id: `${mdm.id}-lab`, ...mdm.lab, isElective: true, trackType: "MDM-III Lab" },
    core[3]  // Environmental Studies
  ];
}

/**
 * Loads current student profile from localStorage or creates default.
 */
function loadCurrentStudentProfile() {
  if (typeof localStorage === "undefined") {
    return createDefaultStudentProfile();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error reading student profile from localStorage:", e);
  }
  const defaultProf = createDefaultStudentProfile();
  saveCurrentStudentProfile(defaultProf);
  return defaultProf;
}

/**
 * Saves current student profile to localStorage.
 */
function saveCurrentStudentProfile(profile) {
  if (typeof localStorage === "undefined") return true;
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(profile));

    // Keep faculty roster synchronized if this student is part of the roster
    const rosterRaw = localStorage.getItem(STORAGE_KEYS.FACULTY_ROSTER);
    if (rosterRaw) {
      const roster = JSON.parse(rosterRaw);
      const idx = roster.findIndex(s => s.rollNo === profile.rollNo);
      if (idx !== -1) {
        roster[idx] = JSON.parse(JSON.stringify(profile));
        localStorage.setItem(STORAGE_KEYS.FACULTY_ROSTER, JSON.stringify(roster));
      }
    }
    return true;
  } catch (e) {
    console.error("Error saving student profile to localStorage:", e);
    return false;
  }
}

/**
 * Loads or initializes mock faculty student roster.
 */
function loadFacultyRoster() {
  if (typeof localStorage === "undefined") {
    return getInitialDemoRoster();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FACULTY_ROSTER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error loading faculty roster:", e);
  }
  const initialRoster = getInitialDemoRoster();
  try {
    localStorage.setItem(STORAGE_KEYS.FACULTY_ROSTER, JSON.stringify(initialRoster));
  } catch (e) { }
  return initialRoster;
}

/**
 * Saves entire faculty roster to localStorage.
 */
function saveFacultyRoster(roster) {
  if (typeof localStorage === "undefined") return true;
  try {
    localStorage.setItem(STORAGE_KEYS.FACULTY_ROSTER, JSON.stringify(roster));
    return true;
  } catch (e) {
    console.error("Error saving faculty roster:", e);
    return false;
  }
}

/**
 * Resets faculty roster to default fictional demo data.
 */
function resetFacultyRoster() {
  const defaults = getInitialDemoRoster();
  saveFacultyRoster(defaults);
  saveCurrentStudentProfile(defaults[0]);
  return defaults;
}

/**
 * Exports current demo dataset as formatted JSON string.
 */
function exportDemoDataAsJson() {
  const current = loadCurrentStudentProfile();
  const roster = loadFacultyRoster();
  const exportPayload = {
    exportDate: new Date().toISOString(),
    institution: "SNJB COE Chandwad",
    semester: "V",
    academicYear: "2026-27",
    currentStudent: current,
    facultyRoster: roster
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Imports demo dataset from JSON string with defensive validation.
 */
function importDemoDataFromJson(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    let rosterToSave = null;

    if (parsed.facultyRoster && Array.isArray(parsed.facultyRoster)) {
      rosterToSave = parsed.facultyRoster;
    } else if (Array.isArray(parsed)) {
      rosterToSave = parsed;
    }

    if (rosterToSave) {
      const cleanedRoster = rosterToSave.map((s, idx) => ({
        rollNo: s.rollNo || `TY-COMP-${idx + 1}`,
        name: s.name || `Student ${idx + 1}`,
        semester: "V",
        academicYear: "2026-27",
        selectedPec1Id: s.selectedPec1Id || "pec-ai",
        selectedMdm3Id: s.selectedMdm3Id || "mdm-civil",
        selectedOe2Id: s.selectedOe2Id || "oe-digital-mktg",
        marks: s.marks || {}
      }));
      saveFacultyRoster(cleanedRoster);
    }

    if (parsed.currentStudent && parsed.currentStudent.rollNo) {
      saveCurrentStudentProfile(parsed.currentStudent);
    } else if (rosterToSave && rosterToSave.length > 0) {
      saveCurrentStudentProfile(rosterToSave[0]);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Gets a student by roll number from roster
 */
function getStudentByRollNo(rollNo) {
  const roster = loadFacultyRoster();
  return roster.find(s => s.rollNo.toUpperCase() === (rollNo || "").toUpperCase()) || null;
}

/**
 * Updates a student profile in roster and keeps current student profile synchronized if matching
 */
function saveStudentProfile(profile) {
  if (!profile || !profile.rollNo) return false;
  const roster = loadFacultyRoster();
  const idx = roster.findIndex(s => s.rollNo === profile.rollNo);
  if (idx !== -1) {
    roster[idx] = JSON.parse(JSON.stringify(profile));
  } else {
    roster.push(JSON.parse(JSON.stringify(profile)));
  }
  saveFacultyRoster(roster);

  const current = loadCurrentStudentProfile();
  if (current && current.rollNo === profile.rollNo) {
    saveCurrentStudentProfile(profile);
  }
  return true;
}

/**
 * Updates single component mark for a student with validation
 */
function updateStudentMarks(rollNo, courseId, componentKey, markValue) {
  const roster = loadFacultyRoster();
  const student = roster.find(s => s.rollNo === rollNo);
  if (!student) return { success: false, error: "Student not found." };
  if (!student.marks) student.marks = {};
  if (!student.marks[courseId]) student.marks[courseId] = {};

  const courses = resolveStudentCourses(student);
  const course = courses.find(c => c.id === courseId);
  if (!course) return { success: false, error: `Course ${courseId} is not applicable to student ${rollNo}.` };

  let valToSave = null;
  if (markValue !== null && markValue !== undefined && markValue !== "") {
    const num = Number(markValue);
    if (isNaN(num) || num < 0) return { success: false, error: "Mark must be a valid non-negative number." };
    const max = course.maxMarks ? course.maxMarks[componentKey] : null;
    if (max !== null && max !== undefined && num > max) {
      return { success: false, error: `Score ${num} exceeds maximum allowable ${max} for ${componentKey.toUpperCase()}.` };
    }
    valToSave = num;
  }
  student.marks[courseId][componentKey] = valToSave;

  saveFacultyRoster(roster);

  const current = loadCurrentStudentProfile();
  if (current && current.rollNo === rollNo) {
    if (!current.marks) current.marks = {};
    if (!current.marks[courseId]) current.marks[courseId] = {};
    current.marks[courseId][componentKey] = valToSave;
    saveCurrentStudentProfile(current);
  }

  return { success: true, student };
}

/**
 * Generates sample CSV template for faculty bulk marks upload
 */
function generateSampleCsvTemplate() {
  const lines = [
    "RollNo,StudentName,CourseId,Component,Marks",
    "TY-COMP-01,Aarav Patil,pcc-automata,cie,18",
    "TY-COMP-01,Aarav Patil,pcc-automata,mse,17",
    "TY-COMP-01,Aarav Patil,pcc-network,cie,19",
    "TY-COMP-01,Aarav Patil,pcc-network-lab,tw,23",
    "TY-COMP-02,Sneha Deshmukh,pcc-automata,cie,19",
    "TY-COMP-02,Sneha Deshmukh,pcc-network,cie,20"
  ];
  return lines.join("\r\n");
}

/**
 * Exports entire student cohort marksheet as formatted CSV
 */
function exportRosterToCsv(roster) {
  const currentRoster = roster || loadFacultyRoster();
  const headers = [
    "RollNo",
    "StudentName",
    "PEC1_Track",
    "MDM3_Track",
    "OE2_Track",
    "CourseId",
    "CourseCode",
    "CourseName",
    "Component",
    "MarksEarned",
    "MaxMarks",
    "Status"
  ];

  const rows = [headers.join(",")];
  const compList = ["cie", "mse", "see", "tw", "pr", "or"];

  currentRoster.forEach(student => {
    const courses = resolveStudentCourses(student);
    courses.forEach(course => {
      const studentCourseMarks = (student.marks && student.marks[course.id]) || {};
      compList.forEach(comp => {
        const max = course.maxMarks ? course.maxMarks[comp] : null;
        if (max !== null && max !== undefined) {
          const rawVal = studentCourseMarks[comp];
          let status = "Pending";
          let earnedStr = "";
          if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
            status = "Evaluated";
            earnedStr = String(rawVal);
          }
          rows.push([
            `"${student.rollNo}"`,
            `"${student.name.replace(/"/g, '""')}"`,
            `"${student.selectedPec1Id}"`,
            `"${student.selectedMdm3Id}"`,
            `"${student.selectedOe2Id}"`,
            `"${course.id}"`,
            `"${course.code}"`,
            `"${course.name.replace(/"/g, '""')}"`,
            `"${comp.toUpperCase()}"`,
            earnedStr !== "" ? earnedStr : '""',
            max,
            `"${status}"`
          ].join(","));
        }
      });
    });
  });

  return rows.join("\r\n");
}

/**
 * Exports Subject-wise performance summary as CSV
 */
function exportSubjectSummariesToCsv(roster) {
  const currentRoster = roster || loadFacultyRoster();
  const headers = [
    "CourseId",
    "CourseCode",
    "CourseName",
    "Category",
    "EnrolledStudents",
    "EvaluatedComponents",
    "PendingComponents",
    "AveragePercentage",
    "HighestMarksEarned",
    "LowestMarksEarned"
  ];

  // Aggregate course stats
  const courseMap = {};
  currentRoster.forEach(student => {
    const courses = resolveStudentCourses(student);
    courses.forEach(c => {
      if (!courseMap[c.id]) {
        courseMap[c.id] = {
          id: c.id,
          code: c.code,
          name: c.name,
          category: c.category,
          enrolled: 0,
          totalEarned: 0,
          totalMax: 0,
          highest: -1,
          lowest: 9999,
          evaluatedCount: 0,
          pendingCount: 0
        };
      }
      const item = courseMap[c.id];
      item.enrolled++;

      const marks = (student.marks && student.marks[c.id]) || {};
      let studentCourseTotal = 0;
      let hasMarks = false;

      ["cie", "mse", "see", "tw", "pr", "or"].forEach(k => {
        const max = c.maxMarks ? c.maxMarks[k] : null;
        if (max !== null && max !== undefined) {
          const val = marks[k];
          if (val !== null && val !== undefined && val !== "") {
            item.evaluatedCount++;
            item.totalEarned += Number(val);
            item.totalMax += max;
            studentCourseTotal += Number(val);
            hasMarks = true;
          } else {
            item.pendingCount++;
          }
        }
      });

      if (hasMarks) {
        if (studentCourseTotal > item.highest) item.highest = studentCourseTotal;
        if (studentCourseTotal < item.lowest) item.lowest = studentCourseTotal;
      }
    });
  });

  const rows = [headers.join(",")];
  Object.values(courseMap).forEach(c => {
    const avgPct = c.totalMax > 0 ? ((c.totalEarned / c.totalMax) * 100).toFixed(1) : "0.0";
    const hi = c.highest >= 0 ? c.highest : "—";
    const lo = c.lowest !== 9999 ? c.lowest : "—";
    rows.push([
      `"${c.id}"`,
      `"${c.code}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      c.enrolled,
      c.evaluatedCount,
      c.pendingCount,
      `"${avgPct}%"`,
      hi,
      lo
    ].join(","));
  });

  return rows.join("\r\n");
}

/**
 * Parses and validates CSV marks text defensively
 */
function parseAndValidateCsv(csvText, roster) {
  if (!csvText || typeof csvText !== "string") {
    return { success: false, errors: ["Empty CSV content provided."], preview: [] };
  }

  const currentRoster = roster || loadFacultyRoster();
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length < 2) {
    return { success: false, errors: ["CSV file must contain a header line and at least one data row."], preview: [] };
  }

  function splitLine(line) {
    const res = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        res.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    res.push(cur.trim());
    return res;
  }

  const header = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, '').toLowerCase());
  const rollIdx = header.findIndex(h => h.includes("roll"));
  const courseIdx = header.findIndex(h => h.includes("course") && !h.includes("name") && !h.includes("code"));
  const compIdx = header.findIndex(h => h.includes("comp") || h === "component");
  const marksIdx = header.findIndex(h => h.includes("mark") || h === "score" || h === "val");

  // Format A: Flat (RollNo, CourseId, Component, Marks)
  const isFlatFormat = rollIdx !== -1 && compIdx !== -1 && marksIdx !== -1;

  const preview = [];
  const errors = [];

  for (let rowIdx = 1; rowIdx < lines.length; rowIdx++) {
    const rawLine = lines[rowIdx];
    if (!rawLine) continue;
    const cols = splitLine(rawLine).map(c => c.replace(/^"|"$/g, ''));

    if (isFlatFormat) {
      const rollNo = cols[rollIdx] || "";
      const courseId = (courseIdx !== -1 ? cols[courseIdx] : "").toLowerCase();
      const comp = (cols[compIdx] || "").toLowerCase();
      const rawMark = cols[marksIdx];

      if (!rollNo) {
        errors.push(`Row ${rowIdx + 1}: Missing student roll number.`);
        continue;
      }

      const student = currentRoster.find(s => s.rollNo.toUpperCase() === rollNo.toUpperCase());
      if (!student) {
        errors.push(`Row ${rowIdx + 1}: Student with roll number '${rollNo}' not found in roster.`);
        continue;
      }

      const courses = resolveStudentCourses(student);
      const course = courses.find(c => c.id.toLowerCase() === courseId || c.code.toLowerCase() === courseId);
      if (!course) {
        errors.push(`Row ${rowIdx + 1}: Course '${courseId}' is not applicable to student '${rollNo}'.`);
        continue;
      }

      const max = course.maxMarks ? course.maxMarks[comp] : null;
      if (max === null || max === undefined) {
        errors.push(`Row ${rowIdx + 1}: Component '${comp.toUpperCase()}' is not applicable to '${course.name}'.`);
        continue;
      }

      let isPending = false;
      let numericValue = null;

      if (rawMark === "" || rawMark === null || rawMark === undefined || rawMark.toLowerCase() === "pending" || rawMark === "—") {
        isPending = true;
      } else {
        const num = Number(rawMark);
        if (isNaN(num)) {
          errors.push(`Row ${rowIdx + 1}: Score '${rawMark}' must be numeric or empty for pending.`);
          continue;
        }
        if (num < 0) {
          errors.push(`Row ${rowIdx + 1}: Score '${rawMark}' cannot be negative.`);
          continue;
        }
        if (num > max) {
          errors.push(`Row ${rowIdx + 1}: Score '${rawMark}' exceeds maximum allowable marks of ${max} for ${comp.toUpperCase()} in ${course.name}.`);
          continue;
        }
        numericValue = num;
      }

      const previousMark = (student.marks && student.marks[course.id]) ? student.marks[course.id][comp] : null;

      preview.push({
        rowNum: rowIdx + 1,
        rollNo: student.rollNo,
        studentName: student.name,
        courseId: course.id,
        courseName: course.name,
        component: comp,
        numericValue: numericValue,
        isPending: isPending,
        max: max,
        previousMark: previousMark
      });
    } else {
      // Wide Format: RollNo, CourseId, CIE, MSE, SEE, TW, PR, OR
      const rollNo = cols[rollIdx !== -1 ? rollIdx : 0] || "";
      const courseId = (courseIdx !== -1 ? cols[courseIdx] : (cols[1] || "")).toLowerCase();

      if (!rollNo) continue;
      const student = currentRoster.find(s => s.rollNo.toUpperCase() === rollNo.toUpperCase());
      if (!student) {
        errors.push(`Row ${rowIdx + 1}: Student '${rollNo}' not found.`);
        continue;
      }

      const courses = resolveStudentCourses(student);
      const course = courses.find(c => c.id.toLowerCase() === courseId || c.code.toLowerCase() === courseId);
      if (!course) {
        errors.push(`Row ${rowIdx + 1}: Course '${courseId}' not found for '${rollNo}'.`);
        continue;
      }

      ["cie", "mse", "see", "tw", "pr", "or"].forEach(k => {
        const kIdx = header.indexOf(k);
        if (kIdx !== -1 && kIdx < cols.length) {
          const rawMark = cols[kIdx];
          const max = course.maxMarks ? course.maxMarks[k] : null;
          if (max !== null && max !== undefined) {
            let isPending = false;
            let numericValue = null;
            if (rawMark === "" || rawMark === null || rawMark === undefined || rawMark.toLowerCase() === "pending") {
              isPending = true;
            } else {
              const num = Number(rawMark);
              if (isNaN(num) || num < 0 || num > max) {
                errors.push(`Row ${rowIdx + 1}: Invalid mark '${rawMark}' for ${k.toUpperCase()} (Max ${max}).`);
                return;
              }
              numericValue = num;
            }

            const previousMark = (student.marks && student.marks[course.id]) ? student.marks[course.id][k] : null;

            preview.push({
              rowNum: rowIdx + 1,
              rollNo: student.rollNo,
              studentName: student.name,
              courseId: course.id,
              courseName: course.name,
              component: k,
              numericValue: numericValue,
              isPending: isPending,
              max: max,
              previousMark: previousMark
            });
          }
        }
      });
    }
  }

  return {
    success: errors.length === 0,
    validCount: preview.length,
    errorCount: errors.length,
    errors: errors,
    preview: preview
  };
}

/**
 * Commits verified preview rows to faculty roster
 */
function applyCsvImport(previewRows, roster) {
  if (!Array.isArray(previewRows) || previewRows.length === 0) {
    return { success: false, appliedCount: 0 };
  }

  const currentRoster = roster || loadFacultyRoster();
  let appliedCount = 0;

  previewRows.forEach(item => {
    const student = currentRoster.find(s => s.rollNo === item.rollNo);
    if (student) {
      if (!student.marks) student.marks = {};
      if (!student.marks[item.courseId]) student.marks[item.courseId] = {};
      student.marks[item.courseId][item.component] = item.isPending ? null : item.numericValue;
      appliedCount++;
    }
  });

  saveFacultyRoster(currentRoster);

  // Sync active student profile if impacted
  const current = loadCurrentStudentProfile();
  if (current) {
    const updated = currentRoster.find(s => s.rollNo === current.rollNo);
    if (updated) {
      saveCurrentStudentProfile(updated);
    }
  }

  return { success: true, appliedCount };
}

function getActiveStudentRollNo() {
  if (typeof localStorage !== "undefined") {
    const roll = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLL);
    if (roll) return roll;
    const current = loadCurrentStudentProfile();
    if (current && current.rollNo) return current.rollNo;
  }
  return "TY-COMP-01";
}

function setActiveStudentRollNo(rollNo) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLL, rollNo);
  }
  const roster = loadFacultyRoster();
  const student = roster.find(s => s.rollNo === rollNo);
  if (student) {
    saveCurrentStudentProfile(student);
  }
}

function loadStudentProfile(rollNo) {
  const targetRoll = rollNo || getActiveStudentRollNo();
  const roster = loadFacultyRoster();
  const found = roster.find(s => s.rollNo === targetRoll);
  if (found) return found;
  return loadCurrentStudentProfile();
}

function getActiveCourses(p1, m3, o2) {
  let profile;
  if (p1 && typeof p1 === "object") {
    profile = p1;
  } else if (typeof p1 === "string") {
    profile = {
      selectedPec1Id: p1,
      selectedMdm3Id: m3,
      selectedOe2Id: o2
    };
  } else {
    profile = loadStudentProfile();
  }
  return resolveStudentCourses(profile);
}

function getPec1Course(id) {
  let data = typeof window !== "undefined" && window.SyllabusData ? window.SyllabusData : null;
  if (!data && typeof require !== "undefined") {
    try { data = require("./data/syllabus-data.js"); } catch (e) { }
  }
  const basket = (data && (data.PEC_1_BASKET || data.PEC1_COURSES || data.PEC1_BASKETS)) || [];
  const item = basket.find(b => b.id === id);
  if (!item) return null;
  return { id: item.id, name: item.theory?.name || item.name, ...item };
}

function getMdm3Course(id) {
  let data = typeof window !== "undefined" && window.SyllabusData ? window.SyllabusData : null;
  if (!data && typeof require !== "undefined") {
    try { data = require("./data/syllabus-data.js"); } catch (e) { }
  }
  const basket = (data && (data.MDM_3_BASKET || data.MDM3_COURSES || data.MDM3_BASKETS)) || [];
  const item = basket.find(b => b.id === id);
  if (!item) return null;
  return { id: item.id, name: item.theory?.name || item.name, ...item };
}

function getOe2Course(id) {
  let data = typeof window !== "undefined" && window.SyllabusData ? window.SyllabusData : null;
  if (!data && typeof require !== "undefined") {
    try { data = require("./data/syllabus-data.js"); } catch (e) { }
  }
  const basket = (data && (data.OE_2_BASKET || data.OE2_COURSES || data.OE2_BASKETS)) || [];
  const item = basket.find(b => b.id === id);
  if (!item) return null;
  return { id: item.id, name: item.name, ...item };
}

function resetStudentToDefaults(rollNo) {
  const defaults = getInitialDemoRoster();
  const defaultStudent = defaults.find(s => s.rollNo === rollNo);
  if (!defaultStudent) return null;
  const roster = loadFacultyRoster();
  const idx = roster.findIndex(s => s.rollNo === rollNo);
  if (idx !== -1) {
    roster[idx] = JSON.parse(JSON.stringify(defaultStudent));
    saveFacultyRoster(roster);
  }
  if (getActiveStudentRollNo() === rollNo) {
    saveCurrentStudentProfile(defaultStudent);
  }
  return defaultStudent;
}

function resetAllStudentsToDefaults() {
  return resetFacultyRoster();
}

function exportRosterJson() {
  const jsonStr = exportDemoDataAsJson();
  if (typeof document !== "undefined") {
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SNJB_Sem5_Roster_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return jsonStr;
}

const AppStorage = {
  STORAGE_KEYS,
  createDefaultStudentProfile,
  getInitialDemoRoster,
  resolveStudentCourses,
  loadCurrentStudentProfile,
  saveCurrentStudentProfile,
  loadFacultyRoster,
  saveFacultyRoster,
  resetFacultyRoster,
  getStudentByRollNo,
  saveStudentProfile,
  updateStudentMarks,
  generateSampleCsvTemplate,
  exportRosterToCsv,
  exportSubjectSummariesToCsv,
  parseAndValidateCsv,
  applyCsvImport,
  exportDemoDataAsJson,
  importDemoDataFromJson,
  // Redesigned UI compatibility methods
  getActiveStudentRollNo,
  setActiveStudentRollNo,
  loadStudentProfile,
  getActiveCourses,
  getPec1Course,
  getMdm3Course,
  getOe2Course,
  resetStudentToDefaults,
  resetAllStudentsToDefaults,
  exportRosterJson
};

if (typeof window !== "undefined") {
  window.AppStorage = AppStorage;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = AppStorage;
}


