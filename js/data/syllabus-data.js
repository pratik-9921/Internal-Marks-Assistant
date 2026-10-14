/**
 * syllabus-data.js
 * Canonical Semester V Syllabus & Evaluation Scheme
 * Source: TYBTech-COMP_2026-27.pdf
 * SNJB's Late Sau. K. B. Jain College of Engineering, Chandwad (Autonomous)
 * Third Year B.Tech Computer Engineering - Semester V (AY 2026-27, Batch 2024-28)
 */

const SYLLABUS_METADATA = {
  institution: "SNJB's Late Sau. K. B. Jain College of Engineering, Chandwad",
  affiliation: "Autonomous Institute Affiliated to Savitribai Phule Pune University",
  program: "Third Year B.Tech Computer Engineering with Multidisciplinary Minor",
  academicYear: "2026-27",
  batch: "2024-28",
  semester: "V",
  totalCredits: 22,
  totalMaxMarks: 650,
  sourceDocument: "TYBTech-COMP_2026-27.pdf",
  scopeNotes: "Initial scope restricted to Semester V core courses and supported elective baskets. Honors (HOC) and Specialization Minor (DMC) tracks are excluded from the active scope."
};

/**
 * Continuous Internal Evaluation (CIE) Formula Configuration
 * Disabled by default until formal departmental breakdown rules are confirmed.
 * Default is direct raw entry out of 20 maximum marks as stated in the PDF.
 */
const CIE_CONFIG = {
  enabled: false,
  description: "Sub-assessment breakdown for CIE (e.g., assignments, unit test conversion) is disabled. Raw score out of 20 is accepted directly.",
  maxCieMarks: 20
};

/**
 * 4 Mandatory Semester V Courses (Automata Theory, Computer Network, Computer Network Lab, Environmental Studies)
 * Non-applicable components are explicitly represented as null (never as zero-mark assessments).
 */
const CORE_COURSES = [
  {
    id: "pcc-automata",
    name: "Automata Theory",
    category: "PCC",
    categoryFullName: "Program Core Course",
    code: "24-PCC-CS-3-01",
    teachingScheme: { l: 3, t: 1, p: 0, totalHours: 4, credits: 4 },
    maxMarks: { cie: 20, mse: 20, see: 60, tw: null, pr: null, or: null, total: 100 },
    pdfPages: "24, 31-33"
  },
  {
    id: "pcc-network",
    name: "Computer Network",
    category: "PCC",
    categoryFullName: "Program Core Course",
    code: "24-PCC-CS-3-02",
    teachingScheme: { l: 3, t: 0, p: 0, totalHours: 3, credits: 3 },
    maxMarks: { cie: 20, mse: 20, see: 60, tw: null, pr: null, or: null, total: 100 },
    pdfPages: "24, 34-36"
  },
  {
    id: "pcc-network-lab",
    name: "Computer Network Lab",
    category: "PCC",
    categoryFullName: "Program Core Course (Laboratory)",
    // Preserved Discrepancy: Page 24 lists 24-PCC-CS-3-03; Page 52 syllabus header lists 24-PCC-CS-3-04
    code: "24-PCC-CS-3-03",
    codePage24: "24-PCC-CS-3-03",
    codePage52: "24-PCC-CS-3-04",
    codeDiscrepancyNote: "Listed as 24-PCC-CS-3-03 in the Semester V Scheme Table (Page 24), but labeled as 24-PCC-CS-3-04 in the Course Syllabus Header (Page 52).",
    teachingScheme: { l: 0, t: 0, p: 4, totalHours: 4, credits: 2 },
    maxMarks: { cie: null, mse: null, see: null, tw: 25, pr: null, or: 25, total: 50 },
    pdfPages: "24, 52-54"
  },
  {
    id: "vec-evs",
    name: "Environmental Studies",
    category: "VEC",
    categoryFullName: "Value Education Course",
    code: "24-VEC-3-01",
    teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
    maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
    pdfPages: "24, 69-70"
  }
];

/**
 * Program Elective Course - I (PEC-I) Basket (Theory 4 Credits + Companion Lab 2 Credits = 6 Credits, 200 Marks)
 */
const PEC_1_BASKET = [
  {
    track: "A",
    id: "pec-cg",
    theory: {
      name: "Computer Graphics",
      code: "24-PEC-CS-3-01A",
      category: "PEC",
      teachingScheme: { l: 4, t: 0, p: 0, totalHours: 4, credits: 4 },
      maxMarks: { cie: 20, mse: 20, see: 60, tw: null, pr: null, or: null, total: 100 },
      pdfPages: "24, 37-39"
    },
    lab: {
      name: "Computer Graphics Laboratory",
      code: "24-PEC-CS-3-02A",
      category: "PEC",
      teachingScheme: { l: 0, t: 0, p: 4, totalHours: 4, credits: 2 },
      maxMarks: { cie: null, mse: null, see: null, tw: 50, pr: 50, or: null, total: 100 },
      pdfPages: "24, 55-57"
    }
  },
  {
    track: "B",
    id: "pec-cyber",
    theory: {
      name: "Cyber Security & Digital Forensic",
      code: "24-PEC-CS-3-01B",
      category: "PEC",
      // Page 24 allocates 4 Hours/Week; Page 40 course syllabus header lists Theory: 3 Hours/Week (Credit 4)
      teachingScheme: { l: 4, t: 0, p: 0, totalHours: 4, credits: 4 },
      discrepancyNote: "Page 24 allocates 4 Hours/Week, while Page 40 course syllabus header lists Theory: 3 Hours/Week (Credit 4).",
      maxMarks: { cie: 20, mse: 20, see: 60, tw: null, pr: null, or: null, total: 100 },
      pdfPages: "24, 40-42"
    },
    lab: {
      name: "Cyber Security & Digital Forensic Lab",
      code: "24-PEC-CS-3-02B",
      category: "PEC",
      teachingScheme: { l: 0, t: 0, p: 4, totalHours: 4, credits: 2 },
      maxMarks: { cie: null, mse: null, see: null, tw: 50, pr: 50, or: null, total: 100 },
      pdfPages: "24, 58-60"
    }
  },
  {
    track: "C",
    id: "pec-ai",
    theory: {
      name: "Artificial Intelligence",
      code: "24-PEC-CS-3-01C",
      category: "PEC",
      teachingScheme: { l: 4, t: 0, p: 0, totalHours: 4, credits: 4 },
      maxMarks: { cie: 20, mse: 20, see: 60, tw: null, pr: null, or: null, total: 100 },
      pdfPages: "24, 43-45"
    },
    lab: {
      name: "Artificial Intelligence Lab",
      code: "24-PEC-CS-3-02C",
      category: "PEC",
      teachingScheme: { l: 0, t: 0, p: 4, totalHours: 4, credits: 2 },
      maxMarks: { cie: null, mse: null, see: null, tw: 50, pr: 50, or: null, total: 100 },
      pdfPages: "24, 61-62"
    }
  },
  {
    track: "D",
    id: "pec-pervasive",
    theory: {
      name: "Pervasive Computing",
      code: "24-PEC-CS-3-01D",
      category: "PEC",
      teachingScheme: { l: 4, t: 0, p: 0, totalHours: 4, credits: 4 },
      maxMarks: { cie: 20, mse: 20, see: 60, tw: null, pr: null, or: null, total: 100 },
      pdfPages: "24, 46-48"
    },
    lab: {
      name: "Pervasive Computing Lab",
      code: "24-PEC-CS-3-02D",
      category: "PEC",
      teachingScheme: { l: 0, t: 0, p: 4, totalHours: 4, credits: 2 },
      maxMarks: { cie: null, mse: null, see: null, tw: 50, pr: 50, or: null, total: 100 },
      pdfPages: "24, 63-65"
    }
  },
  {
    track: "E",
    id: "pec-web",
    theory: {
      name: "Web Technology",
      code: "24-PEC-CS-3-01E",
      category: "PEC",
      teachingScheme: { l: 4, t: 0, p: 0, totalHours: 4, credits: 4 },
      maxMarks: { cie: 20, mse: 20, see: 60, tw: null, pr: null, or: null, total: 100 },
      pdfPages: "24, 49-51"
    },
    lab: {
      name: "Web Technology Lab",
      code: "24-PEC-CS-3-02E",
      category: "PEC",
      teachingScheme: { l: 0, t: 0, p: 4, totalHours: 4, credits: 2 },
      maxMarks: { cie: null, mse: null, see: null, tw: 50, pr: 50, or: null, total: 100 },
      pdfPages: "24, 66-68"
    }
  }
];

/**
 * Multidisciplinary Minor – III (MDM-III) Basket for Semester V (Theory 2 Credits + Lab 1 Credit = 3 Credits, 100 Marks)
 * Offered by departments outside Computer / AIDS.
 */
const MDM_3_BASKET = [
  {
    department: "Civil Engineering",
    id: "mdm-civil",
    theory: {
      name: "Water and Land Management",
      code: "24-MDM-CE-3-01",
      category: "MD M",
      teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
      maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
      pdfPages: "8, 24"
    },
    lab: {
      name: "Water and Land Management Lab",
      code: "24-MDM-CE-3-02",
      category: "MD M",
      teachingScheme: { l: 0, t: 0, p: 2, totalHours: 2, credits: 1 },
      maxMarks: { cie: null, mse: null, see: null, tw: 25, pr: 25, or: null, total: 50 },
      pdfPages: "8, 24"
    }
  },
  {
    department: "Electronics & Telecommunication (Basket A)",
    id: "mdm-etc-drone",
    theory: {
      name: "Drone Technology",
      code: "24-MDM-ET-3-01A",
      category: "MD M",
      teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
      maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
      pdfPages: "9, 24"
    },
    lab: {
      name: "Drone Technology Laboratory",
      code: "24-MDM-ET-3-02A",
      category: "MD M",
      teachingScheme: { l: 0, t: 0, p: 2, totalHours: 2, credits: 1 },
      maxMarks: { cie: null, mse: null, see: null, tw: 25, pr: 25, or: null, total: 50 },
      pdfPages: "9, 24"
    }
  },
  {
    department: "Electronics & Telecommunication (Basket B)",
    id: "mdm-etc-lean",
    theory: {
      name: "Advanced Lean Practices",
      code: "24-MDM-ET-3-01B",
      category: "MD M",
      teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
      maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
      pdfPages: "9, 24"
    },
    lab: {
      name: "Lean Simulation and Automation Lab",
      code: "24-MDM-ET-3-02B",
      category: "MD M",
      teachingScheme: { l: 0, t: 0, p: 2, totalHours: 2, credits: 1 },
      maxMarks: { cie: null, mse: null, see: null, tw: 25, pr: 25, or: null, total: 50 },
      pdfPages: "9, 24"
    }
  },
  {
    department: "Mechanical Engineering",
    id: "mdm-mech",
    theory: {
      name: "HVAC and Green Building",
      code: "24-MDM-ME-3-01",
      category: "MD M",
      teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
      maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
      pdfPages: "9, 24"
    },
    lab: {
      name: "HVAC and Green Building Lab",
      code: "24-MDM-ME-3-02",
      category: "MD M",
      teachingScheme: { l: 0, t: 0, p: 2, totalHours: 2, credits: 1 },
      maxMarks: { cie: null, mse: null, see: null, tw: 25, pr: 25, or: null, total: 50 },
      pdfPages: "9, 24"
    }
  }
];

/**
 * Open Elective – II (OE-II) Basket for Semester V (Theory only: 2 Credits, 50 Marks)
 */
const OE_2_BASKET = [
  {
    id: "oe-agronics",
    code: "24-OEC-3-5-01",
    name: "Agronics",
    category: "OE",
    teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
    maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
    pdfPages: "10, 24"
  },
  {
    id: "oe-digital-mktg",
    code: "24-OEC-3-5-02",
    name: "Digital Marketing",
    category: "OE",
    teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
    maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
    pdfPages: "10, 24"
  },
  {
    id: "oe-estimating",
    code: "24-OEC-3-5-03",
    name: "Estimating and Costing",
    category: "OE",
    teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
    maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
    pdfPages: "10, 24"
  },
  {
    id: "oe-sustainable-energy",
    code: "24-OEC-3-5-04",
    name: "Sustainable Energy Engineering",
    category: "OE",
    teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
    maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
    pdfPages: "10, 24"
  },
  {
    id: "oe-occupational-health",
    code: "24-OEC-3-5-05",
    name: "Occupational Health and Safety",
    category: "OE",
    teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
    maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
    pdfPages: "10, 24"
  },
  {
    id: "oe-circular-economy",
    code: "24-OEC-3-5-06",
    name: "Circular Economy",
    category: "OE",
    teachingScheme: { l: 2, t: 0, p: 0, totalHours: 2, credits: 2 },
    maxMarks: { cie: 20, mse: null, see: 30, tw: null, pr: null, or: null, total: 50 },
    pdfPages: "10, 24"
  }
];

/**
 * Data-validation function to verify data integrity against the PDF syllabus scheme:
 * 1. Confirms presence of all required metadata and attributes.
 * 2. Confirms that no non-applicable component is stored as 0 (must be null or omitted).
 * 3. Confirms that sum of component marks equals maxMarks.total.
 * 4. Confirms that any full student elective track sums to 22 credits and 650 marks.
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateSyllabusData() {
  const errors = [];
  const componentKeys = ["cie", "mse", "see", "tw", "pr", "or"];

  function checkCourse(course, context) {
    if (!course.id || !course.name || !course.code || !course.category) {
      errors.push(`[${context}] Incomplete course metadata.`);
      return;
    }
    const maxMarks = course.maxMarks;
    if (!maxMarks || typeof maxMarks.total !== "number" || maxMarks.total <= 0) {
      errors.push(`[${context} - ${course.name}] Invalid or missing maxMarks.total`);
      return;
    }

    let calculatedSum = 0;
    componentKeys.forEach(key => {
      const val = maxMarks[key];
      if (val === 0) {
        errors.push(`[${context} - ${course.name}] Component '${key}' is marked as 0. Non-applicable components must be null, not zero.`);
      } else if (typeof val === "number") {
        if (val < 0) {
          errors.push(`[${context} - ${course.name}] Component '${key}' has negative mark: ${val}`);
        }
        calculatedSum += val;
      } else if (val !== null && val !== undefined) {
        errors.push(`[${context} - ${course.name}] Component '${key}' has invalid value: ${val}`);
      }
    });

    if (calculatedSum !== maxMarks.total) {
      errors.push(`[${context} - ${course.name}] Sum of components (${calculatedSum}) does not match total (${maxMarks.total})`);
    }
  }

  // 1. Verify Core Courses
  CORE_COURSES.forEach(c => checkCourse(c, "Core Courses"));

  // 2. Verify PEC-I Tracks (Theory & Lab)
  PEC_1_BASKET.forEach(p => {
    checkCourse({ id: p.id, ...p.theory }, `PEC-1 Track ${p.track} Theory`);
    checkCourse({ id: `${p.id}-lab`, ...p.lab }, `PEC-1 Track ${p.track} Lab`);
  });

  // 3. Verify MDM-III Tracks (Theory & Lab)
  MDM_3_BASKET.forEach(m => {
    checkCourse({ id: m.id, ...m.theory }, `MDM-3 ${m.department} Theory`);
    checkCourse({ id: `${m.id}-lab`, ...m.lab }, `MDM-3 ${m.department} Lab`);
  });

  // 4. Verify OE-II Tracks
  OE_2_BASKET.forEach(o => checkCourse(o, "Open Elective II"));

  // 5. Verify semester total marks and credits across any valid student configuration
  const coreTotalMarks = CORE_COURSES.reduce((sum, c) => sum + c.maxMarks.total, 0); // 100+100+50+50 = 300
  const coreCredits = CORE_COURSES.reduce((sum, c) => sum + c.teachingScheme.credits, 0); // 4+3+2+2 = 11

  // PEC-1 adds 200 marks (100+100) and 6 credits (4+2)
  // MDM-3 adds 100 marks (50+50) and 3 credits (2+1)
  // OE-2 adds 50 marks and 2 credits
  const totalSemesterMarks = coreTotalMarks + 200 + 100 + 50; // 650
  const totalSemesterCredits = coreCredits + 6 + 3 + 2;       // 22

  if (totalSemesterMarks !== SYLLABUS_METADATA.totalMaxMarks) {
    errors.push(`Semester marks mismatch: calculated ${totalSemesterMarks}, expected ${SYLLABUS_METADATA.totalMaxMarks}`);
  }
  if (totalSemesterCredits !== SYLLABUS_METADATA.totalCredits) {
    errors.push(`Semester credits mismatch: calculated ${totalSemesterCredits}, expected ${SYLLABUS_METADATA.totalCredits}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Browser global exposure
if (typeof window !== "undefined") {
  window.SyllabusData = {
    METADATA: SYLLABUS_METADATA,
    SYLLABUS_METADATA,
    CIE_CONFIG,
    CORE_COURSES,
    PEC_1_BASKET,
    MDM_3_BASKET,
    OE_2_BASKET,
    PEC1_BASKETS: PEC_1_BASKET,
    MDM3_BASKETS: MDM_3_BASKET,
    OE2_BASKETS: OE_2_BASKET,
    PEC1_COURSES: PEC_1_BASKET.map(b => ({ id: b.id, name: b.theory.name, ...b.theory })),
    MDM3_COURSES: MDM_3_BASKET.map(b => ({ id: b.id, name: b.theory.name, ...b.theory })),
    OE2_COURSES: OE_2_BASKET,
    validateSyllabusData
  };
}

// CommonJS module export for testing environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SYLLABUS_METADATA,
    CIE_CONFIG,
    CORE_COURSES,
    PEC_1_BASKET,
    MDM_3_BASKET,
    OE_2_BASKET,
    PEC1_BASKETS: PEC_1_BASKET,
    MDM3_BASKETS: MDM_3_BASKET,
    OE2_BASKETS: OE_2_BASKET,
    PEC1_COURSES: PEC_1_BASKET.map(b => ({ id: b.id, name: b.theory.name, ...b.theory })),
    MDM3_COURSES: MDM_3_BASKET.map(b => ({ id: b.id, name: b.theory.name, ...b.theory })),
    OE2_COURSES: OE_2_BASKET,
    validateSyllabusData
  };
}
