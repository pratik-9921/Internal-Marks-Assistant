# Internal Marks Assistant

A client-side web application designed for students and faculty of **Third Year B.Tech in Computer Engineering at SNJB's Late Sau. K. B. Jain College of Engineering, Chandwad** for **Semester V (Academic Year 2026–27, 2024–28 Batch)**.

This application is built strictly in accordance with the official autonomous curriculum document: `TYBTech-COMP_2026-27.pdf`.

> [!WARNING]
> **Data Safety Notice:** This application operates entirely client-side using browser `localStorage` for demonstration and estimation purposes. It does not use a secured backend database and must not be used to store confidential or official academic records.

---

## 1. Academic Scope & Baseline

- **Institute:** SNJB's Late Sau. Kantabai Bhavarlalji Jain College of Engineering, Chandwad (Autonomous)
- **Programme:** B.Tech in Computer Engineering with Multidisciplinary Minor
- **Target Semester:** Semester V (Third Year)
- **Academic Year:** 2026–27 (Batch 2024–28)
- **Total Semester Credits:** 22 Credits (16L + 1T + 10P = 27 Hours/Week)
- **Total Semester Marks:** 650 Marks (Theory: 450 Marks, Practical/Oral/Term Work: 200 Marks)

---

## 2. Semester V Evaluation Scheme (Source: Page 24)

| Sr. No. | Subject Name | Category | Course Code(s) | L-T-P | Credits | CIE | MSE | SEE | TW | PR | OR | Total Marks |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | Automata Theory | PCC | `24-PCC-CS-3-01` | 3-1-0 | 4 | 20 | 20 | 60 | — | — | — | 100 |
| 2 | Computer Network | PCC | `24-PCC-CS-3-02` | 3-0-0 | 3 | 20 | 20 | 60 | — | — | — | 100 |
| 3 | Program Elective Course - I (PEC-I) | PEC | *Elective (A–E)* | 4-0-0 | 4 | 20 | 20 | 60 | — | — | — | 100 |
| 4 | MultiDisciplinary Minor-III (MDM-III) | MD M | *Track-dependent* | 2-0-0 | 2 | 20 | — | 30 | — | — | — | 50 |
| 5 | Open Elective - II (OE-II) | OE | *Elective (1–6)* | 2-0-0 | 2 | 20 | — | 30 | — | — | — | 50 |
| 6 | Computer Network Lab | PCC | `24-PCC-CS-3-03` / `24-PCC-CS-3-04` | 0-0-4 | 2 | — | — | — | 25 | — | 25 | 50 |
| 7 | Program Elective Course - I Lab | PEC | *Companion to PEC-I* | 0-0-4 | 2 | — | — | — | 50 | 50 | — | 100 |
| 8 | MultiDisciplinary Minor-III Lab | MD M | *Companion to MDM-III* | 0-0-2 | 1 | — | — | — | 25 | 25 | — | 50 |
| 9 | Environmental Studies | VEC | `24-VEC-3-01` | 2-0-0 | 2 | 20 | — | 30 | — | — | — | 50 |
| **Total** | **Semester V Totals** | | | **16-1-10** | **22** | **120** | **60** | **270** | **100** | **75** | **25** | **650** |

> [!NOTE]
> **Preserved Course Code Discrepancy:** Computer Network Lab is listed as `24-PCC-CS-3-03` in the master scheme table (Page 24), but labeled as `24-PCC-CS-3-04` in the syllabus header (Page 52). Both references are preserved in metadata and UI notes.

---

## 3. Supported Elective Tracks

### A. Program Elective Course - I (Theory + Lab Pairs)
- **Track A:** Computer Graphics (`24-PEC-CS-3-01A` / Lab: `24-PEC-CS-3-02A`)
- **Track B:** Cyber Security & Digital Forensic (`24-PEC-CS-3-01B` / Lab: `24-PEC-CS-3-02B`)
- **Track C:** Artificial Intelligence (`24-PEC-CS-3-01C` / Lab: `24-PEC-CS-3-02C`)
- **Track D:** Pervasive Computing (`24-PEC-CS-3-01D` / Lab: `24-PEC-CS-3-02D`)
- **Track E:** Web Technology (`24-PEC-CS-3-01E` / Lab: `24-PEC-CS-3-02E`)

### B. Multidisciplinary Minor - III (Theory + Lab Pairs)
- **Civil Engineering:** Water and Land Management (`24-MDM-CE-3-01` / Lab: `24-MDM-CE-3-02`)
- **E&TC Engineering (Basket A):** Drone Technology (`24-MDM-ET-3-01A` / Lab: `24-MDM-ET-3-02A`)
- **E&TC Engineering (Basket B):** Advanced Lean Practices (`24-MDM-ET-3-01B` / Lab: `24-MDM-ET-3-02B`)
- **Mechanical Engineering:** HVAC and Green Building (`24-MDM-ME-3-01` / Lab: `24-MDM-ME-3-02`)

### C. Open Elective - II (Theory Only)
- `24-OEC-3-5-01`: Agronics
- `24-OEC-3-5-02`: Digital Marketing
- `24-OEC-3-5-03`: Estimating and Costing
- `24-OEC-3-5-04`: Sustainable Energy Engineering
- `24-OEC-3-5-05`: Occupational Health and Safety
- `24-OEC-3-5-06`: Circular Economy

---

## 4. Key Rules & Implementation Safeguards

1. **Strict PDF Marks Scheme:** Preserves exact component limits (CIE 20, MSE 20, SEE 60/30, TW 25/50, PR 25/50, OR 25). No arbitrary pass/fail rules, grading formulas, or unverified cutoffs are implemented.
2. **Individual Student Selections:** Each student profile saves their custom combination of PEC-I, MDM-III, and OE-II in `localStorage`.
3. **Entered vs. Pending Marks Distinction:** Missing or blank marks are treated as *Pending*, never coerced to zero. Evaluated percentages reflect only completed assessments.
4. **Disabled CIE Sub-Assessment Formula:** Direct raw marks out of 20 are accepted; secondary sub-component conversions (e.g., test averages, quizzes) remain disabled (`enabled: false`) until officially confirmed by the department.
5. **Zapier Chatbots Integration Placeholder:** A dedicated container (`#zapier-chatbot-container`) is included in `ai-assistant.html` with no fabricated credentials or unauthorized API scripts.

---

## 5. File Structure

```text
Internal-Marks-Assistant/
├── index.html              # Student Dashboard & Performance Overview (KPIs, Charts)
├── calculator.html         # Interactive Marks & Target Calculator (Course selection & marks entry)
├── faculty.html            # Faculty Demo Panel (Cohort roster, statistics, JSON export/import)
├── ai-assistant.html       # AI Assistant Page (Interactive chatbot with tool execution & syllabus search)
├── server.js               # Zero-dependency Node.js HTTP server & Gemini API proxy with tool execution
├── test_regression.js      # Comprehensive regression & validation test suite (Syllabus, Calculator, Tools)
├── test_server.js          # Integration test suite for HTTP routes and static file serving
├── README.md               # Project documentation & execution guide
├── .gitignore              # Ignores .env, node_modules/, and temporary logs
├── TYBTech-COMP_2026-27.pdf# Source curriculum PDF
├── css/
│   └── style.css           # Vanilla CSS design system (Inter typography, cards, chat & tool styling)
└── js/
    ├── app.js              # View controller, chat client & DOM event coordinator
    ├── calculator.js       # Calculation engine (entered vs. pending totals, validation)
    ├── charts.js           # Chart.js visualizers (subject bar & assessment doughnut charts)
    ├── storage.js          # localStorage data manager (student profiles & demo roster)
    └── data/
        └── syllabus-data.js# Canonical Semester V schema, marks boundaries, discrepancy notes
```

---

## 6. How to Launch and Test Locally

### Primary Launch Method: Node.js Backend Server (Recommended for Full AI Assistant)

The project includes a lightweight, zero-dependency Node.js server (`server.js`) that serves static files and securely proxies chat requests to Google Gemini 2.5 Flash, executing real tools locally.

1. **Configure Gemini API Key (Optional for basic preview, Required for live AI):**
   - Create a file named `.env` in the project root:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     PORT=3000
     ```
   - *Alternatively, set it in PowerShell:*
     ```powershell
     $env:GEMINI_API_KEY="your_gemini_api_key_here"
     ```
   > [!IMPORTANT]
   > The API key is read solely by `server.js` and is never bundled into client-side scripts, HTML, or Git commits. `.env` is listed in `.gitignore`.

2. **Start the Server:**
   ```powershell
   node server.js
   ```
   *Expected output:*
   ```text
   ====================================================
    Internal Marks Assistant Server Running
    URL: http://localhost:3000
    Gemini Key Configured: true (or false)
   ====================================================
   ```

3. **Open the Application:**
   Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.
   To visit the AI Assistant directly: **[http://localhost:3000/ai-assistant.html](http://localhost:3000/ai-assistant.html)**.

4. **Stop the Server:**
   Press `Ctrl + C` in the PowerShell terminal.

---

### Alternative Method: Static Python Server (UI & Calculations Only)

If you only wish to test the Dashboard, Marks Calculator, and Faculty Panel without activating Gemini AI responses:
```powershell
python -m http.server 8000
```
Open **[http://localhost:8000](http://localhost:8000)**. When navigating to AI Assistant, the page will display a clear status indicator showing that the Node backend is required for live AI responses.

---

## 7. AI Assistant & Genuine Tool Execution

The AI Assistant (`ai-assistant.html`) communicates with Google Gemini 2.5 Flash using real Function Calling / Tools:

1. **`get_marks_summary`**:
   - Calls `calculator.calculateStudentSummary()` on the active student profile.
   - Returns verified marks earned, maximum of completed assessments, evaluated percentage (e.g. `84.21%`), and standing out of 650 marks (`49.23%`).
2. **`get_pending_assessments`**:
   - Analyzes all active courses and returns the precise list of examinations marked as `pending` (e.g. upcoming Semester End Examinations).

In the chat interface, when Gemini calls a tool, a visible **⚙️ Tool Executed** badge is rendered. Clicking on the badge displays the exact JSON payload returned by the calculation engine.

---

## 8. Running Automated Regression & Integration Tests

The project includes automated regression test scripts using Node.js's built-in `assert` module:

### 1. Regression Test Suite (`test_regression.js`)
Tests syllabus schema integrity, boundary validations, pending/zero/N/A logic, Aarav Patil baseline calculations, server tool executions, client-side key security, and faculty roster consistency:
```powershell
node test_regression.js
```
*Expected result:*
```text
=== Running Regression Test Suite ===
✔ Test 1: Syllabus metadata and course definitions verified valid.
✔ Test 2: Component validation, pending, bounds, and N/A rules verified.
✔ Test 3: Aarav Patil summary calculations (320/380 = 84.21%, 320/650 = 49.23%) verified.
✔ Test 4: Server tool 'get_marks_summary' verified.
✔ Test 5: Server tool 'get_pending_assessments' verified (6 pending components).
✔ Test 6: Security checks passed - No API keys in client-side code and .env is gitignored.
✔ Test 7: Faculty roster integrity verified across all students.

========================================
 ALL REGRESSION TESTS PASSED (7 / 7) ✔ 
========================================
```

### 2. HTTP Server & Endpoints Test (`test_server.js`)
Verifies `/api/status`, `/api/chat` error handling, and static file delivery across all pages:
```powershell
node test_server.js
```
*Expected result:*
```text
==========================================
 ALL SERVER ENDPOINT TESTS PASSED (5 / 5) ✔ 
==========================================
```
