module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const isConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;
  res.end(JSON.stringify({
    status: "ok",
    configured: isConfigured,
    model: "gemini-2.5-flash",
    availableTools: ["get_marks_summary", "get_pending_assessments", "get_class_roster_summary", "get_student_detail"],
    semester: "V",
    institution: "SNJB COE Chandwad"
  }));
};
