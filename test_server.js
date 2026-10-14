/**
 * test_server.js
 * Verifies HTTP endpoints and static file serving on server.js
 */

const http = require("http");
const assert = require("assert");
const { server } = require("./server.js");

const TEST_PORT = 3009;

server.listen(TEST_PORT, async () => {
  console.log(`[TestServer] Started on port ${TEST_PORT}`);

  function makeRequest(path, method = "GET", postData = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path: path,
        method: method,
        headers: {}
      };

      if (postData) {
        options.headers["Content-Type"] = "application/json";
        options.headers["Content-Length"] = Buffer.byteLength(postData);
      }

      const req = http.request(options, res => {
        let body = "";
        res.on("data", chunk => (body += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });

      req.on("error", reject);
      if (postData) req.write(postData);
      req.end();
    });
  }

  try {
    // 1. Test GET /api/status
    const statusRes = await makeRequest("/api/status");
    assert.strictEqual(statusRes.statusCode, 200);
    const statusJson = JSON.parse(statusRes.body);
    assert.strictEqual(statusJson.status, "ok");
    assert.strictEqual(statusJson.model, "gemini-2.5-flash");
    assert.strictEqual(typeof statusJson.configured, "boolean");
    console.log(`✔ Test Server 1: GET /api/status returned 200 with model info (Configured: ${statusJson.configured}).`);

    // 2. Test POST /api/chat validation on empty message or missing key
    const chatRes = await makeRequest("/api/chat", "POST", JSON.stringify({ message: "" }));
    assert.strictEqual(chatRes.statusCode, 400);
    const chatJson = JSON.parse(chatRes.body);
    assert(chatJson.error, "Must return error message on invalid request");
    console.log("✔ Test Server 2: POST /api/chat returned 400 on empty message validation.");

    // 3. Test Static File Serving: index.html
    const indexRes = await makeRequest("/");
    assert.strictEqual(indexRes.statusCode, 200);
    assert(indexRes.headers["content-type"].includes("text/html"));
    assert(indexRes.body.includes("Internal Marks Assistant"));
    console.log("✔ Test Server 3: GET / served index.html with 200 OK.");

    // 4. Test Static File Serving: ai-assistant.html
    const aiRes = await makeRequest("/ai-assistant.html");
    assert.strictEqual(aiRes.statusCode, 200);
    assert(aiRes.headers["content-type"].includes("text/html"));
    assert(aiRes.body.includes("SNJB Academic Advisor"));
    console.log("✔ Test Server 4: GET /ai-assistant.html served with 200 OK.");

    // 5. Test Static File Serving: style.css
    const cssRes = await makeRequest("/css/style.css");
    assert.strictEqual(cssRes.statusCode, 200);
    assert(cssRes.headers["content-type"].includes("text/css"));
    console.log("✔ Test Server 5: GET /css/style.css served with 200 OK.");

    console.log("\n==========================================");
    console.log(" ALL SERVER ENDPOINT TESTS PASSED (5 / 5) ✔ ");
    console.log("==========================================");
  } catch (err) {
    console.error("Server test failure:", err);
    process.exit(1);
  } finally {
    server.close();
  }
});
