/**
 * calculator.js
 * Calculation & Validation Engine for Semester V Evaluation
 * Source: TYBTech-COMP_2026-27.pdf (Page 24)
 * Strictly evaluates only active selected courses and components.
 * Explicitly distinguishes entered marks from pending/missing components without arbitrary passing rules.
 */

const ASSESSMENT_COMPONENTS = ["cie", "mse", "see", "tw", "pr", "or"];
const SEMESTER_MAX_MARKS = 650;

/**
 * Validates a single component mark against course maximum limits.
 * @param {Object} course - The course object with maxMarks.
 * @param {string} componentKey - One of ASSESSMENT_COMPONENTS ('cie', 'mse', etc.).
 * @param {any} value - The input value to validate.
 * @returns {{ valid: boolean, isPending?: boolean, isApplicable?: boolean, numericValue?: number, error?: string }}
 */
function validateMark(course, componentKey, value) {
  if (!course || !course.maxMarks) {
    return { valid: false, error: "Invalid course specification." };
  }

  const max = course.maxMarks[componentKey];

  // 1. Check applicability: must not be null/undefined in syllabus schema
  if (max === null || max === undefined) {
    return {
      valid: false,
      isApplicable: false,
      error: `${componentKey.toUpperCase()} is not applicable to ${course.name}.`
    };
  }

  // 2. Check pending/blank state
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    return {
      valid: true,
      isPending: true,
      isApplicable: true,
      value: null
    };
  }

  // 3. Check numeric validity
  const numeric = Number(value);
  if (isNaN(numeric) || typeof value === "boolean") {
    return {
      valid: false,
      isApplicable: true,
      error: `Score for ${componentKey.toUpperCase()} must be a valid number.`
    };
  }

  // 4. Check boundaries (0 <= mark <= max)
  if (numeric < 0) {
    return {
      valid: false,
      isApplicable: true,
      error: `Score for ${componentKey.toUpperCase()} cannot be negative.`
    };
  }

  if (numeric > max) {
    return {
      valid: false,
      isApplicable: true,
      error: `Score for ${componentKey.toUpperCase()} exceeds maximum allowable marks of ${max}.`
    };
  }

  return {
    valid: true,
    isPending: false,
    isApplicable: true,
    numericValue: numeric
  };
}

/**
 * Resolves the 9 active courses applicable to a student profile.
 * Falls back to SyllabusData if not provided directly.
 */
function resolveCourses(profile, syllabusData) {
  let data = syllabusData
    || (typeof window !== "undefined" && window.SyllabusData ? window.SyllabusData : null);

  if (!data && typeof require !== "undefined") {
    try {
      data = require("./data/syllabus-data.js");
    } catch (e) {
      // Ignore if require path fails
    }
  }

  if (!data || !data.CORE_COURSES) {
    return [];
  }

  const core = data.CORE_COURSES;
  const pec = (data.PEC_1_BASKET && data.PEC_1_BASKET.find(p => p.id === profile.selectedPec1Id))
    || data.PEC_1_BASKET[0];
  const mdm = (data.MDM_3_BASKET && data.MDM_3_BASKET.find(m => m.id === profile.selectedMdm3Id))
    || data.MDM_3_BASKET[0];
  const oe = (data.OE_2_BASKET && data.OE_2_BASKET.find(o => o.id === profile.selectedOe2Id))
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
 * Computes performance summary for a student profile across their active courses.
 * Calculates entered marks, maximum of entered, current percentage, standing against 650,
 * and tracks remaining pending components without applying unverified passing rules.
 *
 * @param {Object} profile - Student profile containing elective choices and marks.
 * @param {Array} [activeCourses] - Optional pre-resolved array of 9 active courses.
 * @param {Object} [syllabusData] - Optional syllabus data object (useful for Node testing).
 * @returns {Object} Comprehensive evaluation summary.
 */
function calculateStudentSummary(profile, activeCourses, syllabusData) {
  let courses = activeCourses;
  if (!courses || courses.length === 0) {
    if (typeof window !== "undefined" && window.AppStorage && typeof window.AppStorage.resolveStudentCourses === "function") {
      courses = window.AppStorage.resolveStudentCourses(profile);
    } else {
      courses = resolveCourses(profile, syllabusData);
    }
  }

  const marksMap = (profile && profile.marks) || {};
  const validationErrors = [];

  let totalMarksEntered = 0;
  let maxMarksOfEnteredComponents = 0;
  let theoryMarksEntered = 0;
  let theoryMaxOfEntered = 0;
  let labMarksEntered = 0;
  let labMaxOfEntered = 0;

  let completedComponentsCount = 0;
  let pendingComponentsCount = 0;
  let totalApplicableComponentsCount = 0;

  const courseBreakdown = courses.map(course => {
    const courseMarks = marksMap[course.id] || {};
    let courseEntered = 0;
    let courseMaxEntered = 0;
    let coursePendingCount = 0;

    const components = {};

    ASSESSMENT_COMPONENTS.forEach(comp => {
      const max = course.maxMarks ? course.maxMarks[comp] : null;

      // Non-applicable component
      if (max === null || max === undefined) {
        components[comp] = { status: "na", value: null, max: null };
        return;
      }

      totalApplicableComponentsCount++;
      const rawVal = courseMarks[comp];
      const validation = validateMark(course, comp, rawVal);

      if (!validation.valid) {
        validationErrors.push({
          courseId: course.id,
          courseName: course.name,
          component: comp,
          error: validation.error
        });
        components[comp] = { status: "invalid", value: rawVal, max: max, error: validation.error };
      } else if (validation.isPending) {
        components[comp] = { status: "pending", value: null, max: max };
        coursePendingCount++;
        pendingComponentsCount++;
      } else {
        const num = validation.numericValue;
        components[comp] = { status: "entered", value: num, max: max };
        courseEntered += num;
        courseMaxEntered += max;
        completedComponentsCount++;

        totalMarksEntered += num;
        maxMarksOfEnteredComponents += max;

        if (["cie", "mse", "see"].includes(comp)) {
          theoryMarksEntered += num;
          theoryMaxOfEntered += max;
        } else {
          labMarksEntered += num;
          labMaxOfEntered += max;
        }
      }
    });

    return {
      courseId: course.id,
      name: course.name,
      code: course.code,
      category: course.category,
      maxPossibleCourseMarks: course.maxMarks ? course.maxMarks.total : 0,
      enteredMarks: courseEntered,
      maxOfEntered: courseMaxEntered,
      pendingCount: coursePendingCount,
      components: components
    };
  });

  const enteredPercentage = maxMarksOfEnteredComponents > 0
    ? ((totalMarksEntered / maxMarksOfEnteredComponents) * 100).toFixed(2)
    : "0.00";

  const projectedSemesterPercentage = ((totalMarksEntered / SEMESTER_MAX_MARKS) * 100).toFixed(2);

  return {
    totalSemesterMaxMarks: SEMESTER_MAX_MARKS, // 650
    totalMarksEntered,
    maxMarksOfEnteredComponents,
    enteredPercentage,
    projectedSemesterPercentage,
    theoryMarksEntered,
    theoryMaxOfEntered,
    labMarksEntered,
    labMaxOfEntered,
    completedComponentsCount,
    pendingComponentsCount,
    totalApplicableComponentsCount,
    validationErrors,
    hasErrors: validationErrors.length > 0,
    courseBreakdown
  };
}

/**
 * Computes classroom-wide evaluation statistics and subject breakdown
 * @param {Array} roster - Array of student profiles
 * @param {Object} [syllabusData] - Optional syllabus data object
 * @returns {Object} Classroom performance metrics
 */
function calculateClassSummary(roster, syllabusData) {
  if (!Array.isArray(roster) || roster.length === 0) {
    return {
      totalStudents: 0,
      classAveragePercentage: "0.00",
      classAverageSemesterStanding: "0.00",
      totalPendingAcrossCohort: 0,
      totalCompletedAcrossCohort: 0,
      topPerformer: null,
      courseSummaries: []
    };
  }

  let totalEvaluatedPercentage = 0;
  let totalSemesterStanding = 0;
  let totalPendingAcrossCohort = 0;
  let totalCompletedAcrossCohort = 0;
  let topPerformer = null;
  let topPct = -1;

  const courseMap = {};

  roster.forEach(student => {
    const summary = calculateStudentSummary(student, null, syllabusData);
    const pct = Number(summary.enteredPercentage) || 0;
    const standing = Number(summary.projectedSemesterPercentage) || 0;

    totalEvaluatedPercentage += pct;
    totalSemesterStanding += standing;
    totalPendingAcrossCohort += summary.pendingComponentsCount;
    totalCompletedAcrossCohort += summary.completedComponentsCount;

    if (pct > topPct) {
      topPct = pct;
      topPerformer = {
        name: student.name,
        rollNo: student.rollNo,
        enteredPercentage: summary.enteredPercentage,
        standingMarks: `${summary.totalMarksEntered} / ${summary.totalSemesterMaxMarks}`
      };
    }

    summary.courseBreakdown.forEach(c => {
      if (!courseMap[c.courseId]) {
        courseMap[c.courseId] = {
          courseId: c.courseId,
          name: c.name,
          code: c.code,
          category: c.category,
          maxPossible: c.maxPossibleCourseMarks,
          enrolledCount: 0,
          totalEarned: 0,
          totalMaxEvaluated: 0,
          highestEarned: -1,
          lowestEarned: 9999,
          pendingCount: 0,
          completedCount: 0,
          componentBreakdown: {}
        };
      }

      const item = courseMap[c.courseId];
      item.enrolledCount++;
      item.totalEarned += c.enteredMarks;
      item.totalMaxEvaluated += c.maxOfEntered;
      item.pendingCount += c.pendingCount;

      if (c.maxOfEntered > 0) {
        if (c.enteredMarks > item.highestEarned) item.highestEarned = c.enteredMarks;
        if (c.enteredMarks < item.lowestEarned) item.lowestEarned = c.enteredMarks;
      }

      ASSESSMENT_COMPONENTS.forEach(comp => {
        const compData = c.components[comp];
        if (compData && compData.status !== "na") {
          if (!item.componentBreakdown[comp]) {
            item.componentBreakdown[comp] = {
              max: compData.max,
              evaluatedCount: 0,
              pendingCount: 0,
              totalScore: 0
            };
          }
          if (compData.status === "entered") {
            item.componentBreakdown[comp].evaluatedCount++;
            item.componentBreakdown[comp].totalScore += compData.value;
            item.completedCount++;
          } else if (compData.status === "pending") {
            item.componentBreakdown[comp].pendingCount++;
          }
        }
      });
    });
  });

  const courseSummaries = Object.values(courseMap).map(c => {
    const avgPct = c.totalMaxEvaluated > 0
      ? ((c.totalEarned / c.totalMaxEvaluated) * 100).toFixed(2)
      : "0.00";
    const avgMarks = c.enrolledCount > 0 ? (c.totalEarned / c.enrolledCount).toFixed(1) : "0.0";
    return {
      courseId: c.courseId,
      name: c.name,
      code: c.code,
      category: c.category,
      maxPossible: c.maxPossible,
      enrolledCount: c.enrolledCount,
      averageMarks: avgMarks,
      averagePercentage: avgPct,
      highestEarned: c.highestEarned >= 0 ? c.highestEarned : 0,
      lowestEarned: c.lowestEarned !== 9999 ? c.lowestEarned : 0,
      pendingCount: c.pendingCount,
      completedCount: c.completedCount,
      componentBreakdown: c.componentBreakdown
    };
  });

  return {
    totalStudents: roster.length,
    classAveragePercentage: (totalEvaluatedPercentage / roster.length).toFixed(2),
    classAverageSemesterStanding: (totalSemesterStanding / roster.length).toFixed(2),
    totalPendingAcrossCohort,
    totalCompletedAcrossCohort,
    topPerformer,
    courseSummaries
  };
}

const AppCalculator = {
  ASSESSMENT_COMPONENTS,
  SEMESTER_MAX_MARKS,
  validateMark,
  resolveCourses,
  calculateStudentSummary,
  calculateClassSummary
};

// Global browser exposure
if (typeof window !== "undefined") {
  window.AppCalculator = AppCalculator;
}

// CommonJS export for Node.js test runner
if (typeof module !== "undefined" && module.exports) {
  module.exports = AppCalculator;
}

