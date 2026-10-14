/**
 * test_regression.js
 * Automated Regression & Integration Test Suite
 * Tests calculations, tools, server endpoints, and key security.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

// 1. Syllabus & Calculator Tests
const syllabusData = require("./js/data/syllabus-data.js");
const calculator = require("./js/calculator.js");
const storage = require("./js/storage.js");
const { executeTool } = require("./server.js");

console.log("=== Running Regression Test Suite ===");

// Test 1: Syllabus Data Verification
const syllabusCheck = syllabusData.validateSyllabusData();
assert.strictEqual(syllabusCheck.isValid, true, `Syllabus validation failed: ${syllabusCheck.errors.join(", ")}`);
console.log("✔ Test 1: Syllabus metadata and course definitions verified valid.");

// Test 2: Calculator Pending vs Zero vs N/A
const automataCourse = syllabusData.CORE_COURSES.find(c => c.id === "pcc-automata");
const networkLab = syllabusData.CORE_COURSES.find(c => c.id === "pcc-network-lab");

// Test valid mark
assert.strictEqual(calculator.validateMark(automataCourse, "cie", 18).valid, true);
assert.strictEqual(calculator.validateMark(automataCourse, "cie", 18).numericValue, 18);

// Test pending mark (blank or null)
const pendingMark = calculator.validateMark(automataCourse, "see", null);
assert.strictEqual(pendingMark.valid, true);
assert.strictEqual(pendingMark.isPending, true);

// Test N/A mark
const naMark = calculator.validateMark(automataCourse, "tw", 20);
assert.strictEqual(naMark.valid, false);
assert.strictEqual(naMark.isApplicable, false);

// Test boundary violations
assert.strictEqual(calculator.validateMark(automataCourse, "cie", 25).valid, false); // CIE max is 20
assert.strictEqual(calculator.validateMark(automataCourse, "cie", -5).valid, false); // Cannot be negative
console.log("✔ Test 2: Component validation, pending, bounds, and N/A rules verified.");

// Test 3: Student Summary Calculations (Aarav Patil - Baseline)
const aarav = storage.createDefaultStudentProfile("Aarav Patil", "TY-COMP-01");
const summaryAarav = calculator.calculateStudentSummary(aarav);

assert.strictEqual(summaryAarav.totalMarksEntered, 320, "Total entered marks should be 320");
assert.strictEqual(summaryAarav.maxMarksOfEnteredComponents, 380, "Max marks of entered components should be 380");
assert.strictEqual(summaryAarav.enteredPercentage, "84.21", "Evaluated percentage should be 84.21%");
assert.strictEqual(summaryAarav.projectedSemesterPercentage, "49.23", "Semester standing should be 49.23%");
assert.strictEqual(summaryAarav.totalSemesterMaxMarks, 650, "Total semester scheme must be 650 marks");
assert.strictEqual(summaryAarav.completedComponentsCount, 15, "Completed components count should be 15");
assert.strictEqual(summaryAarav.pendingComponentsCount, 6, "Pending components count should be 6");
assert.strictEqual(summaryAarav.totalApplicableComponentsCount, 21, "Total applicable components must be 21");
console.log("✔ Test 3: Aarav Patil summary calculations (320/380 = 84.21%, 320/650 = 49.23%) verified.");

// Test 4: Tool Execution - get_marks_summary
const toolSummary = executeTool("get_marks_summary", {}, aarav);
assert.strictEqual(toolSummary.studentName, "Aarav Patil");
assert.strictEqual(toolSummary.totalMarksEntered, 320);
assert.strictEqual(toolSummary.maxMarksOfEnteredComponents, 380);
assert.strictEqual(toolSummary.enteredPercentage, "84.21%");
assert.strictEqual(toolSummary.semesterStandingMarks, "320 / 650");
assert.strictEqual(toolSummary.pendingComponentsCount, 6);
console.log("✔ Test 4: Server tool 'get_marks_summary' verified.");

// Test 5: Tool Execution - get_pending_assessments
const toolPending = executeTool("get_pending_assessments", {}, aarav);
assert.strictEqual(toolPending.totalPendingCount, 6);
assert.strictEqual(toolPending.pendingAssessments.length, 6);
// Verify each pending assessment has maxMarks and component name
toolPending.pendingAssessments.forEach(item => {
  assert(item.courseName, "Must have course name");
  assert(item.courseCode, "Must have course code");
  assert(item.assessmentComponent, "Must have assessment component");
  assert(typeof item.maxMarks === "number" && item.maxMarks > 0, "Must have positive max marks");
});
console.log("✔ Test 5: Server tool 'get_pending_assessments' verified (6 pending components).");

// Test 6: Security Verification - No API keys in frontend code
const clientFiles = [
  "index.html",
  "calculator.html",
  "faculty.html",
  "ai-assistant.html",
  "js/app.js",
  "js/calculator.js",
  "js/storage.js",
  "js/charts.js",
  "js/data/syllabus-data.js"
];

clientFiles.forEach(file => {
  const content = fs.readFileSync(path.join(__dirname, file), "utf8");
  assert(!content.includes("AIzaSy"), `Possible Google API key found in ${file}!`);
  assert(!/GEMINI_API_KEY\s*=\s*['"][^'"]+['"]/.test(content), `Hardcoded GEMINI_API_KEY assignment found in ${file}!`);
});

// Verify .gitignore ignores .env
const gitignore = fs.readFileSync(path.join(__dirname, ".gitignore"), "utf8");
assert(gitignore.includes(".env"), ".gitignore must contain .env");
console.log("✔ Test 6: Security checks passed - No API keys in client-side code and .env is gitignored.");

// Test 7: Faculty Roster Evaluation
const roster = storage.loadFacultyRoster();
assert(roster.length >= 4, "Roster should have at least 4 demo students");
roster.forEach(student => {
  const s = calculator.calculateStudentSummary(student);
  assert(typeof s.totalMarksEntered === "number", `Student ${student.name} entered marks must be number`);
  assert(s.totalSemesterMaxMarks === 650, `Student ${student.name} semester max must be 650`);
});
console.log("✔ Test 7: Faculty roster integrity verified across all students.");

// Test 8: Faculty Class Summary & Server Tools
const classSummary = calculator.calculateClassSummary(roster, syllabusData);
assert(classSummary.totalStudents >= 4, "Class summary should report all students");
assert(classSummary.classAveragePercentage !== undefined, "Should have class average percentage");
assert(classSummary.courseSummaries.length > 0, "Should have course summaries");
const toolClassSummary = executeTool("get_class_roster_summary", {}, aarav, roster);
assert.strictEqual(toolClassSummary.totalStudents, roster.length);
const toolDetail = executeTool("get_student_detail", { rollNo: "TY-COMP-01" }, aarav, roster);
assert.strictEqual(toolDetail.rollNo, "TY-COMP-01");
assert.strictEqual(toolDetail.name, "Aarav Patil");
console.log("✔ Test 8: Faculty class summary & tools 'get_class_roster_summary', 'get_student_detail' verified.");

// Test 9: CSV Marksheet Export & Defensive Import Validation
const csvExport = storage.exportRosterToCsv(roster);
assert(csvExport.includes("RollNo,StudentName"), "CSV export must contain header");
assert(csvExport.includes("TY-COMP-01"), "CSV export must include student roll");
assert(csvExport.includes("pcc-automata"), "CSV export must include courses");

// Test valid CSV import
const sampleCsv = storage.generateSampleCsvTemplate();
const validParse = storage.parseAndValidateCsv(sampleCsv, roster);
assert.strictEqual(validParse.success, true, "Valid CSV template should pass without error");
assert(validParse.validCount > 0, "Should have valid rows");

// Test invalid boundary CSV import
const invalidCsv = `RollNo,StudentName,CourseId,Component,Marks\nTY-COMP-01,Aarav Patil,pcc-automata,cie,99\nTY-COMP-01,Aarav Patil,pcc-automata,tw,10`;
const invalidParse = storage.parseAndValidateCsv(invalidCsv, roster);
assert.strictEqual(invalidParse.success, false, "Invalid CSV must fail validation");
assert(invalidParse.errorCount >= 2, "Should capture boundary error (99 > 20) and non-applicable component error (TW on Automata)");
console.log("✔ Test 9: CSV export, template generation, and defensive import validation verified.");

console.log("\n==========================================");
console.log(" ALL REGRESSION TESTS PASSED (9 / 9) ✔ ");
console.log("==========================================");

