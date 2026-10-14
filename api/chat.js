const { callGeminiApi } = require("../server.js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  try {
    let payload = req.body;
    if (typeof payload === "string") {
      try { payload = JSON.parse(payload); } catch {}
    } else if (!payload) {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      try { payload = JSON.parse(body || "{}"); } catch { payload = {}; }
    }
    payload = payload || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 400;
      res.end(JSON.stringify({
        error: "GEMINI_API_KEY is not configured on the server. Please set the environment variable in your Vercel Project Settings.",
        configured: false
      }));
      return;
    }

    const userMessage = payload.message || "";
    const profile = payload.profile || {};
    const history = payload.history || [];
    const roster = payload.roster || [];

    if (!userMessage.trim()) {
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Message cannot be empty." }));
      return;
    }

    const result = await callGeminiApi(apiKey, userMessage, profile, history, roster);
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (err) {
    console.error("[Vercel /api/chat Error]:", err.message);
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 500;
    res.end(JSON.stringify({
      error: "Failed to communicate with AI Assistant: " + err.message
    }));
  }
};
