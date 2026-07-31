import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const distDir = new URL("../dist/", import.meta.url);
const serverDir = new URL("../dist/server/", import.meta.url);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "server") continue;
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(absolutePath)));
    else files.push(absolutePath);
  }

  return files;
}

const rootPath = fileURLToPath(distDir);
const files = await collectFiles(rootPath);
const assets = {};

for (const file of files) {
  const route = `/${relative(rootPath, file).split(sep).join("/")}`;
  assets[route] = {
    body: (await readFile(file)).toString("base64"),
    type: mimeTypes[extname(file)] ?? "application/octet-stream",
  };
}

const workerSource = `const assets=${JSON.stringify(assets)};
function decode(value){const binary=atob(value);const bytes=new Uint8Array(binary.length);for(let index=0;index<binary.length;index+=1)bytes[index]=binary.charCodeAt(index);return bytes;}
export default{async fetch(request){const url=new URL(request.url);const key=url.pathname==="/" ? "/index.html" : url.pathname;const asset=assets[key]??(request.method==="GET" ? assets["/index.html"] : null);if(!asset)return new Response("Not found",{status:404});return new Response(decode(asset.body),{headers:{"content-type":asset.type,"cache-control":key==="/index.html"?"no-cache":"public, max-age=31536000, immutable"}});}};`;

await mkdir(serverDir, { recursive: true });
await writeFile(new URL("index.js", serverDir), workerSource);
