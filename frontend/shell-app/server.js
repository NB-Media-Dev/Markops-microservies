import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4200;
const PUBLIC_DIR = path.join(__dirname, "public");
const SRC_INDEX = path.join(__dirname, "src", "index.html");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health endpoint
  if (req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", service: "shell-host", port: PORT, timestamp: new Date().toISOString() }));
    return;
  }

  // File resolution: serve static assets from public/ and SPA fallback to src/index.html
  const cleanUrl = req.url.split("?")[0];
  let filePath = path.join(PUBLIC_DIR, cleanUrl === "/" ? "index.html" : cleanUrl);

  if (cleanUrl === "/" || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = SRC_INDEX;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Server Error: ${err.message}`);
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n======================================================`);
  console.log(`🚀 MarkOps Enterprise Portal Active!`);
  console.log(`👉 Primary URL : http://localhost:${PORT}`);
  console.log(`👉 Source HTML : ${SRC_INDEX}`);
  console.log(`👉 Remote MFEs : Login (4201) | Designer (4202) | Admin (4203) | Digital (4204) | Telecaller (4205)`);
  console.log(`======================================================\n`);
});
