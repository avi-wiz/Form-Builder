import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();
const dist = resolve(root, "dist");
const out = resolve(root, ".vercel/output");

if (existsSync(out)) rmSync(out, { recursive: true });
mkdirSync(out, { recursive: true });

// config.json → .vercel/output/config.json
cpSync(resolve(dist, "config.json"), resolve(out, "config.json"));

// dist/client → .vercel/output/static
cpSync(resolve(dist, "client"), resolve(out, "static"), { recursive: true });

// dist/server → .vercel/output/functions/__server.func
const funcDir = resolve(out, "functions/__server.func");
mkdirSync(funcDir, { recursive: true });
cpSync(resolve(dist, "server"), funcDir, { recursive: true });

// Nitro emits a web-fetch handler (export default { fetch(req) }).
// Wrap it in a Node.js handler that Vercel's nodejs runtime understands.
writeFileSync(resolve(funcDir, "vercel-handler.mjs"), `
import handler from "./index.mjs";
export default async function vercelHandler(req, res) {
  const url = new URL(req.url, \`http://\${req.headers.host}\`);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v != null) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
  }
  const method = req.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  const fetchReq = new Request(url.href, {
    method,
    headers,
    body: hasBody ? req : undefined,
    duplex: hasBody ? "half" : undefined,
  });
  const fetchRes = await handler.fetch(fetchReq);
  res.statusCode = fetchRes.status;
  fetchRes.headers.forEach((v, k) => res.setHeader(k, v));
  const buf = await fetchRes.arrayBuffer();
  res.end(Buffer.from(buf));
}
`);

writeFileSync(resolve(funcDir, ".vc-config.json"), JSON.stringify({
  runtime: "nodejs22.x",
  handler: "vercel-handler.mjs",
  launcherType: "Nodejs",
  shouldAddHelpers: false,
}, null, 2));

console.log("✓ .vercel/output ready");
