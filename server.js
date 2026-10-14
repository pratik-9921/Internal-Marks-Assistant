/**
 * server.js
 * Lightweight Node.js Backend & Static Server for Internal Marks Assistant
 * Serves frontend static assets and acts as a secure proxy to the Google Gemini API.
 * Keeps GEMINI_API_KEY strictly on the server and provides real tool execution.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

// Load local modules
const syllabusData = require("./js/data/syllabus-data.js");
const calculator = require("./js/calculator.js");
const storage = require("./js/storage.js");

// 1. Simple zero-dependency .env file parser
function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf8");
      content.split("\n").forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            let val = trimmed.substring(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
      console.log("[Server] Loaded environment variables from .env");
    } catch (err) {
      console.warn("[Server] Could not read .env file:", err.message);
    }
  }
}

loadEnvFile();

const PORT = process.env.PORT || 3000;
const GEMINI_MODEL = "gemini-2.5-flash";

// 2. MIME Types Mapping
const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

// 3. Tool Implementations (Genuine calculation & pending logic)
function executeTool(toolName, args = {}, studentProfile = {}, roster = []) {
  const courses = calculator.resolveCourses(studentProfile, syllabusData);
  const summary = calculator.calculateStudentSummary(studentProfile, courses, syllabusData);

  if (toolName === "get_marks_summary") {
    return {
      studentName: studentProfile.name || "Unknown",
      rollNo: studentProfile.rollNo || "Unknown",
      totalMarksEntered: summary.totalMarksEntered,
      maxMarksOfEnteredComponents: summary.maxMarksOfEnteredComponents,
      enteredPercentage: summary.enteredPercentage + "%",
      semesterStandingPercentage: summary.projectedSemesterPercentage + "%",
      semesterStandingMarks: `${summary.totalMarksEntered} / 650`,
      completedComponentsCount: summary.completedComponentsCount,
      pendingComponentsCount: summary.pendingComponentsCount,
      totalApplicableComponents: summary.totalApplicableComponentsCount,
      theoryMarksEntered: `${summary.theoryMarksEntered} / ${summary.theoryMaxOfEntered}`,
      labMarksEntered: `${summary.labMarksEntered} / ${summary.labMaxOfEntered}`
    };
  }

  if (toolName === "get_pending_assessments") {
    const pendingList = [];
    summary.courseBreakdown.forEach(c => {
      Object.keys(c.components).forEach(comp => {
        if (c.components[comp].status === "pending") {
          pendingList.push({
            courseName: c.name,
            courseCode: c.code,
            category: c.category,
            assessmentComponent: comp.toUpperCase(),
            maxMarks: c.components[comp].max
          });
        }
      });
    });

    return {
      totalPendingCount: pendingList.length,
      pendingAssessments: pendingList
    };
  }

  if (toolName === "get_class_roster_summary") {
    const classRoster = (Array.isArray(roster) && roster.length > 0) ? roster : storage.loadFacultyRoster();
    return calculator.calculateClassSummary(classRoster, syllabusData);
  }

  if (toolName === "get_student_detail") {
    const classRoster = (Array.isArray(roster) && roster.length > 0) ? roster : storage.loadFacultyRoster();
    const queryRoll = (args && args.rollNo ? String(args.rollNo).trim().toUpperCase() : "");
    const student = classRoster.find(s => s.rollNo.toUpperCase() === queryRoll) 
      || (studentProfile && studentProfile.rollNo ? studentProfile : classRoster[0]);

    const sCourses = calculator.resolveCourses(student, syllabusData);
    const sSummary = calculator.calculateStudentSummary(student, sCourses, syllabusData);

    const pendingComps = [];
    sSummary.courseBreakdown.forEach(c => {
      Object.keys(c.components).forEach(k => {
        if (c.components[k].status === "pending") {
          pendingComps.push(`${c.name} (${k.toUpperCase()}: Max ${c.components[k].max})`);
        }
      });
    });

    return {
      rollNo: student.rollNo,
      name: student.name,
      totalMarksEntered: sSummary.totalMarksEntered,
      maxMarksOfEntered: sSummary.maxMarksOfEnteredComponents,
      enteredPercentage: sSummary.enteredPercentage + "%",
      semesterStanding: `${sSummary.totalMarksEntered} / 650 (${sSummary.projectedSemesterPercentage}%)`,
      pendingCount: sSummary.pendingComponentsCount,
      completedCount: sSummary.completedComponentsCount,
      pendingComponentsList: pendingComps
    };
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

// Tool Declarations for Gemini API
const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_marks_summary",
        description: "Retrieves the active student's evaluated marks summary, including marks earned, maximum marks of completed components, percentage, and overall semester standing out of 650.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "get_pending_assessments",
        description: "Retrieves a detailed list of all remaining pending examination and assessment components for the active student across their Semester V courses.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "get_class_roster_summary",
        description: "Retrieves class-wide continuous evaluation statistics, class average percentage, top performers, total pending assessments across the cohort, and course summaries for faculty reporting.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "get_student_detail",
        description: "Retrieves detailed continuous evaluation records and remaining assessments for a specific student in the class roster by roll number (e.g. 'TY-COMP-01').",
        parameters: {
          type: "OBJECT",
          properties: {
            rollNo: {
              type: "STRING",
              description: "The roll number of the student (e.g. 'TY-COMP-01', 'TY-COMP-02')."
            }
          }
        }
      }
    ]
  }
];

const SYSTEM_INSTRUCTION = `You are the official Academic Assistant for Third Year B.Tech Computer Engineering (Semester V) at SNJB's Late Sau. K. B. Jain College of Engineering, Chandwad (Autonomous, AY 2026-27).
You assist students and faculty in tracking continuous evaluation performance, pending examinations, syllabus requirements, and class cohort reports.

CRITICAL INSTRUCTIONS:
1. Always use your available tools:
   - 'get_marks_summary': For active student marks summary.
   - 'get_pending_assessments': For active student pending exams.
   - 'get_class_roster_summary': For class-wide statistics, class average, and cohort pending counts.
   - 'get_student_detail': For a specific student's marks by roll number.
2. Ground all answers strictly on the tool results and confirmed Semester V syllabus (TYBTech-COMP_2026-27.pdf).
3. Total semester scheme is 650 marks across 22 credits.
4. Explain clearly:
   - "Evaluated Performance" is based only on completed components.
   - "Semester Standing" is progress towards the total 650 marks.
   - Unentered exams are Pending, not zero.
5. Provide actionable, supportive recommendations (e.g., preparation priorities for upcoming SEE exams).
6. Note any relevant course details, such as the Computer Network Lab dual course code (24-PCC-CS-3-03 / 24-PCC-CS-3-04) if asked.
7. Distinguish calculated facts from suggestions. Never fabricate student records or claim actions succeeded when they did not.`;

// 4. Gemini API Interaction
// 4. Gemini API Interaction
async function callGeminiApi(apiKey, userMessage, profile, history = [], roster = []) {
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  // Build conversation history
  const contents = [];
  if (Array.isArray(history)) {
    history.forEach(item => {
      if (item.role && item.text) {
        contents.push({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.text }]
        });
      }
    });
  }

  // Add current user prompt
  contents.push({
    role: "user",
    parts: [{ text: userMessage }]
  });

  const toolsExecuted = [];

  // Step A: First request with tool declarations
  let response = await fetch(geminiEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: contents,
      tools: GEMINI_TOOLS
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorBody}`);
  }

  let data = await response.json();
  let candidate = data.candidates && data.candidates[0];
  let content = candidate && candidate.content;

  // Step B: Check for function calls
  const functionCalls = content && content.parts && content.parts.filter(p => p.functionCall);

  if (functionCalls && functionCalls.length > 0) {
    // Append model's tool call turn
    contents.push(content);

    // Execute each requested tool locally
    const responseParts = [];
    for (const part of functionCalls) {
      const call = part.functionCall;
      console.log(`[Server] Executing tool: ${call.name}`);
      try {
        const result = executeTool(call.name, call.args || {}, profile, roster);
        toolsExecuted.push({
          name: call.name,
          args: call.args || {},
          result: result
        });
        responseParts.push({
          functionResponse: {
            name: call.name,
            response: { result: result }
          }
        });
      } catch (err) {
        console.error(`[Server] Tool execution failed for ${call.name}:`, err.message);
        responseParts.push({
          functionResponse: {
            name: call.name,
            response: { error: err.message }
          }
        });
      }
    }

    // Append function response turn
    contents.push({
      role: "user",
      parts: responseParts
    });

    // Step C: Second call to generate final answer using tool output
    response = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: contents
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API Tool-Turn Error (${response.status}): ${errorBody}`);
    }

    data = await response.json();
    candidate = data.candidates && data.candidates[0];
    content = candidate && candidate.content;
  }

  // Extract text response
  let replyText = "";
  if (content && content.parts) {
    replyText = content.parts.map(p => p.text || "").join("").trim();
  }

  if (!replyText) {
    replyText = "I processed your request, but could not generate a textual reply.";
  }

  return {
    reply: replyText,
    toolsExecuted: toolsExecuted
  };
}

// 5. HTTP Server Request Dispatcher
async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  // Enable CORS for local convenience
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Route: GET /api/status
  if (pathname === "/api/status" && req.method === "GET") {
    const isConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      configured: isConfigured,
      model: GEMINI_MODEL,
      availableTools: ["get_marks_summary", "get_pending_assessments", "get_class_roster_summary", "get_student_detail"],
      semester: "V",
      institution: "SNJB COE Chandwad"
    }));
    return;
  }

  // API Route: POST /api/chat
  if (pathname === "/api/chat" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy(); // 1MB limit
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.trim() === "") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            error: "GEMINI_API_KEY is not configured on the server. Please set the environment variable or create a .env file.",
            configured: false
          }));
          return;
        }

        const userMessage = payload.message || "";
        const profile = payload.profile || {};
        const history = payload.history || [];
        const roster = payload.roster || [];

        if (!userMessage.trim()) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Message cannot be empty." }));
          return;
        }

        const result = await callGeminiApi(apiKey, userMessage, profile, history, roster);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error("[Server Error /api/chat]:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          error: "Failed to communicate with AI Assistant: " + err.message
        }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);

  // Security: Prevent directory traversal outside __dirname
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(handleRequest);

// Start listening if run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Internal Marks Assistant Server Running`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Gemini Key Configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
    console.log(`====================================================`);
  });
}

module.exports = handleRequest;
module.exports.handleRequest = handleRequest;
module.exports.server = server;
module.exports.executeTool = executeTool;
module.exports.GEMINI_TOOLS = GEMINI_TOOLS;
module.exports.SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION;
module.exports.callGeminiApi = callGeminiApi;
module.exports.GEMINI_MODEL = GEMINI_MODEL;

