import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const apiKey = process.env.OPENAI_API_KEY;
const publicUrl = process.env.PUBLIC_PROTOTYPE_URL || "";
const model = process.env.OPENAI_AGENT_MODEL || "gpt-6-astra";
const apiBase = "https://api.openai.com/v1";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

function json(res, status, value) {
  res.writeHead(status, { "content-type": mime[".json"], "cache-control": "no-store" });
  res.end(JSON.stringify(value));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 64_000) throw new Error("Request body too large");
  }
  return raw ? JSON.parse(raw) : {};
}

function safePublicUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

async function openai(path, options = {}) {
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured on the server");
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
      "openai-beta": "agents=v1",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(body?.error?.message || `OpenAI API returned ${response.status}`);
  return body;
}

function agentInstructions(driver) {
  const other = driver === "A" ? "B" : "A";
  return [
    `You are racing as Agent ${driver}.`,
    `Open only the supplied Agent Circuit URL and control only Agent ${driver}.`,
    `Switch the page to computer-use mode if needed, then press Start race.`,
    `Repeatedly observe the visible circuit and telemetry, choosing among Agent ${driver}'s Steer left, Throttle, Steer right, and Brake buttons.`,
    `Never operate Agent ${other}'s controls. Do not navigate to any other origin.`,
    `Continue until the UI reports FINISHED, then report your finishing state.`,
  ].join(" ");
}

async function createDriverSession(driver, targetUrl) {
  const session = await openai("/agents/sessions", {
    method: "POST",
    body: JSON.stringify({
      agent: {
        name: `Agent Circuit Driver ${driver}`,
        model,
        instructions: agentInstructions(driver),
        tools: [{ type: "computer_use", include_screenshots: true }],
      },
      environment: {
        type: "openai_hosted",
        desktop: { enabled: true },
        network: { access: "enabled" },
      },
    }),
  });

  await openai(`/agents/sessions/${encodeURIComponent(session.id)}/events`, {
    method: "POST",
    body: JSON.stringify({
      events: [{
        type: "agent.session.input.message",
        input: [{ role: "user", content: [{ type: "input_text", text: `Open ${targetUrl}?driver=${driver.toLowerCase()} and race now.` }] }],
      }],
    }),
  });
  return { id: session.id, driver };
}

async function approveExactOrigin(sessionId, targetUrl) {
  const targetOrigin = new URL(targetUrl).origin;
  const session = await openai(`/agents/sessions/${encodeURIComponent(sessionId)}`);
  const approvals = (session.required_actions || []).filter(action =>
    action.type === "computer_use_approval_request" &&
    action.request?.type === "browser_origin_access"
  );
  const results = [];
  for (const approval of approvals) {
    const requested = approval.request?.origin;
    const decision = requested === targetOrigin ? "approve" : "deny";
    await openai(`/agents/sessions/${encodeURIComponent(sessionId)}/events`, {
      method: "POST",
      body: JSON.stringify({ events: [{
        type: "agent.session.input.computer_use_approval_request_result",
        request_id: approval.request_id,
        response: { type: "browser_origin_access", decision },
      }] }),
    });
    results.push({ origin: requested, decision });
  }
  return results;
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    return json(res, 200, {
      ok: true,
      apiKeyConfigured: Boolean(apiKey),
      publicUrlConfigured: safePublicUrl(publicUrl),
      model,
    });
  }

  if (req.method === "POST" && url.pathname === "/api/agents/launch") {
    const body = await readJson(req);
    const targetUrl = body.targetUrl || publicUrl;
    if (!safePublicUrl(targetUrl)) {
      return json(res, 400, { error: "Set PUBLIC_PROTOTYPE_URL to a public HTTPS URL. OpenAI-hosted browsers cannot reach localhost." });
    }
    const [a, b] = await Promise.all([
      createDriverSession("A", targetUrl),
      createDriverSession("B", targetUrl),
    ]);
    return json(res, 201, { sessions: [a, b], targetUrl, next: "Approve the requested origin after sessions enter requires_action." });
  }

  if (req.method === "POST" && /^\/api\/agents\/[^/]+\/approve$/.test(url.pathname)) {
    const sessionId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readJson(req);
    const targetUrl = body.targetUrl || publicUrl;
    if (!safePublicUrl(targetUrl)) return json(res, 400, { error: "A public HTTPS target URL is required." });
    return json(res, 200, { approvals: await approveExactOrigin(sessionId, targetUrl) });
  }

  if (req.method === "GET" && /^\/api\/agents\/[^/]+$/.test(url.pathname)) {
    const sessionId = decodeURIComponent(url.pathname.split("/")[3]);
    const session = await openai(`/agents/sessions/${encodeURIComponent(sessionId)}`);
    return json(res, 200, {
      id: session.id,
      status: session.status,
      requiredActions: session.required_actions || [],
    });
  }

  return json(res, 404, { error: "API route not found" });
}

async function serveStatic(res, pathname) {
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const normalized = normalize(requested);
  if (normalized.startsWith("..")) return json(res, 403, { error: "Forbidden" });
  try {
    const file = join(root, normalized);
    const data = await readFile(file);
    res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    json(res, 404, { error: "Not found" });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return await serveStatic(res, url.pathname);
  } catch (error) {
    console.error(error.message);
    return json(res, 500, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Agent Circuit: http://127.0.0.1:${port}`);
  console.log(`OpenAI key: ${apiKey ? "configured" : "missing"}`);
  console.log(`Public URL: ${safePublicUrl(publicUrl) ? publicUrl : "not configured"}`);
});

