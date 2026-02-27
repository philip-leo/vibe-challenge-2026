#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const VALID_METHODS = new Set(["auto", "http", "playwright"]);

function printUsage() {
  console.log(`Usage:
  npm run v0:extract -- <v0-template-url> [--out output/v0] [--slug name] [--method auto|http|playwright]

Examples:
  npm run v0:extract -- https://v0.app/templates/logo-particles-v0-aws-AdFqYlEFVdC
  npm run v0:extract -- https://v0.app/templates/logo-particles-v0-aws-AdFqYlEFVdC --slug logo-particles
  npm run v0:extract -- https://v0.app/templates/logo-particles-v0-aws-AdFqYlEFVdC --method http
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    out: "output/v0",
    slug: "",
    method: "auto",
    sourceUrl: "",
  };
  const positional = [];

  while (args.length > 0) {
    const arg = args.shift();
    if (!arg) continue;

    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--out") {
      options.out = args.shift() || "";
      continue;
    }

    if (arg === "--slug") {
      options.slug = args.shift() || "";
      continue;
    }

    if (arg === "--method") {
      options.method = args.shift() || "";
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  if (positional.length !== 1) {
    throw new Error("Expected exactly one URL argument.");
  }

  if (!VALID_METHODS.has(options.method)) {
    throw new Error(`Invalid --method value "${options.method}". Use auto, http, or playwright.`);
  }

  options.sourceUrl = positional[0];
  return options;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function deriveSlug(sourceUrl, override) {
  if (override) {
    const clean = slugify(override);
    if (!clean) throw new Error("The provided --slug becomes empty after sanitization.");
    return clean;
  }

  const url = new URL(sourceUrl);
  const fromPath = url.pathname.split("/").filter(Boolean).at(-1) || url.hostname;
  const clean = slugify(fromPath);
  return clean || `v0-${Date.now()}`;
}

async function fetchText(url) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching ${url}`);
    }
    return response.text();
  } catch (error) {
    const fallback = spawnSync("curl", ["-sL", url], {
      encoding: "utf8",
      maxBuffer: 25 * 1024 * 1024,
    });

    if (fallback.status === 0 && fallback.stdout) {
      return fallback.stdout;
    }

    const fetchMessage = error instanceof Error ? error.message : String(error);
    const curlMessage = `${fallback.stdout || ""}\n${fallback.stderr || ""}`.trim();
    throw new Error(
      `Failed to fetch ${url}. fetch=${fetchMessage}. curl=${curlMessage || `exit ${fallback.status}`}`
    );
  }
}

function normalizeEscapes(value) {
  return value
    .replace(/\\u0026/g, "&")
    .replace(/\\u003d/g, "=")
    .replace(/\\u002f/gi, "/")
    .replace(/\\u003a/gi, ":")
    .replace(/\\\//g, "/");
}

function extractPreviewUrlFromTemplateHtml(html) {
  const normalized = normalizeEscapes(html);

  const direct =
    normalized.match(/https:\/\/preview-[^"'\\s]+\.vusercontent\.net\/\?mql=true&__v0=[^"'\\s]*/i) ||
    normalized.match(/https:\/\/preview-[^"'\\s]+\.vusercontent\.net\/\?mql=true&__v0=/i) ||
    normalized.match(/https:\/\/preview-[^"'\\s]+\.vusercontent\.net\/?/i);

  if (direct) {
    const url = direct[0];
    return url.includes("?") ? url : `${url.replace(/\/?$/, "/")}?mql=true&__v0=`;
  }

  const hostMatch =
    normalized.match(/originalHost=([a-z0-9-]+\.vusercontent\.net)/i) ||
    normalized.match(/"originalHost":"([a-z0-9-]+\.vusercontent\.net)"/i);

  if (hostMatch) {
    return `https://${hostMatch[1]}/?mql=true&__v0=`;
  }

  return null;
}

function getPlaywrightWrapperPath() {
  if (process.env.PWCLI) return process.env.PWCLI;
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  return path.join(codexHome, "skills", "playwright", "scripts", "playwright_cli.sh");
}

function runPlaywrightCommand(wrapperPath, args, allowFailure = false) {
  const result = spawnSync(wrapperPath, args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    throw result.error;
  }

  if (!allowFailure && result.status !== 0) {
    const details = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
    throw new Error(`Playwright command failed: ${args.join(" ")}\n${details}`);
  }

  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractPreviewUrlWithPlaywright(templateUrl) {
  const wrapper = getPlaywrightWrapperPath();
  if (!fs.existsSync(wrapper)) {
    throw new Error(
      `Playwright wrapper not found at ${wrapper}. Set PWCLI or install the Playwright skill before using --method playwright.`
    );
  }

  runPlaywrightCommand(wrapper, ["close-all"], true);
  runPlaywrightCommand(wrapper, ["open", templateUrl]);

  let lastOutput = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    const iframeOutput = runPlaywrightCommand(wrapper, [
      "eval",
      "() => Array.from(document.querySelectorAll('iframe')).map((f) => f.src)",
    ]);
    lastOutput = iframeOutput;

    const iframeMatch =
      iframeOutput.match(/https:\/\/preview-[^"'\\s]+\.vusercontent\.net\/\?mql=true&__v0=[^"'\\s]*/i) ||
      iframeOutput.match(/https:\/\/preview-[^"'\\s]+\.vusercontent\.net\/\?mql=true&__v0=/i) ||
      iframeOutput.match(/https:\/\/preview-[^"'\\s]+\.vusercontent\.net\/?/i);
    if (iframeMatch) {
      runPlaywrightCommand(wrapper, ["close-all"], true);
      const previewUrl = iframeMatch[0];
      return previewUrl.includes("?") ? previewUrl : `${previewUrl.replace(/\/?$/, "/")}?mql=true&__v0=`;
    }

    const htmlHintOutput = runPlaywrightCommand(wrapper, [
      "eval",
      "() => (document.documentElement.innerHTML.match(/preview-[a-z0-9-]+\\.vusercontent\\.net/gi) || []).slice(0, 3)",
    ]);
    lastOutput = htmlHintOutput;
    const hostMatch = htmlHintOutput.match(/preview-[a-z0-9-]+\.vusercontent\.net/gi);
    if (hostMatch && hostMatch[0]) {
      runPlaywrightCommand(wrapper, ["close-all"], true);
      return `https://${hostMatch[0]}/?mql=true&__v0=`;
    }

    await sleep(750);
  }

  runPlaywrightCommand(wrapper, ["close-all"], true);
  throw new Error(
    `Playwright ran but no preview iframe URL was detected. Last output snippet: ${lastOutput
      .replace(/\s+/g, " ")
      .slice(0, 220)}`
  );
}

function collectFlightChunks(html) {
  const chunks = [];
  const regex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const encoded = match[1];
    try {
      chunks.push(JSON.parse(`"${encoded}"`));
    } catch {
      // Ignore malformed chunk and keep scanning.
    }
  }

  if (chunks.length === 0) {
    throw new Error("Unable to parse Next.js flight chunks from preview HTML.");
  }

  return chunks;
}

function extractFileEntries(decodedFlight) {
  const entries = [];
  const regex = /\["([^"\n]+)",\{"type":"file","data":"(\$?[^"\n]+)"\}\]/g;
  let match;

  while ((match = regex.exec(decodedFlight)) !== null) {
    entries.push({ fileName: match[1], dataRef: match[2] });
  }

  const unique = new Map();
  for (const entry of entries) {
    unique.set(entry.fileName, entry);
  }

  return [...unique.values()];
}

function decodeJsonStringValue(value) {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value;
  }
}

function buildReferenceMap(decodedFlight) {
  const refs = new Map();

  const quotedRegex = /(?:^|\n)([A-Za-z0-9]+):"((?:[^"\\]|\\.)*)/g;
  let quotedMatch;
  while ((quotedMatch = quotedRegex.exec(decodedFlight)) !== null) {
    refs.set(quotedMatch[1], decodeJsonStringValue(quotedMatch[2]));
  }

  const textRegex = /(?:^|\n)([A-Za-z0-9]+):T([0-9a-fA-F]+),/g;
  let textMatch;
  while ((textMatch = textRegex.exec(decodedFlight)) !== null) {
    const id = textMatch[1];
    const size = Number.parseInt(textMatch[2], 16);
    if (!Number.isFinite(size) || size <= 0) continue;
    const start = textMatch.index + textMatch[0].length;
    const value = decodedFlight.slice(start, start + size);
    if (value.length === size) {
      refs.set(id, value);
    }
  }

  return refs;
}

function resolveFileContent(dataRef, refs) {
  if (!dataRef.startsWith("$")) {
    return decodeJsonStringValue(dataRef);
  }

  const visited = new Set();
  let current = dataRef.slice(1);
  while (true) {
    if (visited.has(current)) return null;
    visited.add(current);

    const value = refs.get(current);
    if (typeof value !== "string") return null;
    if (!value.startsWith("$")) return value;
    current = value.slice(1);
  }
}

function extractFilesFromPreviewHtml(html) {
  const chunks = collectFlightChunks(html);
  const decodedFlight = chunks.join("");
  const fileEntries = extractFileEntries(decodedFlight);
  if (fileEntries.length === 0) {
    throw new Error("No file descriptors found in preview payload.");
  }

  const refs = buildReferenceMap(decodedFlight);
  const files = [];
  const missing = [];

  for (const entry of fileEntries) {
    const content = resolveFileContent(entry.dataRef, refs);
    if (content === null) {
      missing.push(`${entry.fileName} (${entry.dataRef})`);
      continue;
    }

    files.push({
      name: entry.fileName,
      content: content.replace(/\r\n/g, "\n"),
    });
  }

  if (files.length === 0) {
    throw new Error(
      `Found file descriptors but could not resolve any file content references: ${missing.join(", ")}`
    );
  }

  return { files, missing };
}

function safeOutputPath(baseDir, fileName) {
  const cleaned = fileName.replace(/^[/\\]+/, "").replace(/\.\.(\/|\\)/g, "");
  const outputPath = path.resolve(baseDir, cleaned);
  const resolvedBase = path.resolve(baseDir);
  if (outputPath !== resolvedBase && !outputPath.startsWith(`${resolvedBase}${path.sep}`)) {
    throw new Error(`Unsafe output path rejected: ${fileName}`);
  }
  return outputPath;
}

function writeOutputFiles(baseDir, files) {
  const written = [];
  fs.mkdirSync(baseDir, { recursive: true });

  for (const file of files) {
    const outputPath = safeOutputPath(baseDir, file.name);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, file.content, "utf8");
    written.push({
      name: file.name,
      bytes: Buffer.byteLength(file.content, "utf8"),
      path: outputPath,
    });
  }

  return written;
}

async function resolvePreviewUrl(sourceUrl, method) {
  const sourceHost = new URL(sourceUrl).hostname;
  if (sourceHost.endsWith("vusercontent.net")) {
    return { previewUrl: sourceUrl, discoverMethod: "direct" };
  }

  if (method === "http" || method === "auto") {
    const templateHtml = await fetchText(sourceUrl);
    const previewUrl = extractPreviewUrlFromTemplateHtml(templateHtml);
    if (previewUrl) {
      return { previewUrl, discoverMethod: "http" };
    }
    if (method === "http") {
      throw new Error(
        "Could not discover preview URL via HTTP parsing. Retry with --method auto or --method playwright."
      );
    }
  }

  if (method === "playwright" || method === "auto") {
    const previewUrl = await extractPreviewUrlWithPlaywright(sourceUrl);
    return { previewUrl, discoverMethod: "playwright" };
  }

  throw new Error("Could not resolve a preview URL.");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  let sourceUrl;
  try {
    sourceUrl = new URL(options.sourceUrl).toString();
  } catch {
    throw new Error(`Invalid URL: ${options.sourceUrl}`);
  }

  const slug = deriveSlug(sourceUrl, options.slug);
  const outputRoot = path.resolve(options.out);
  const outputDir = path.join(outputRoot, slug);

  const { previewUrl, discoverMethod } = await resolvePreviewUrl(sourceUrl, options.method);
  const previewHtml = await fetchText(previewUrl);
  const { files, missing } = extractFilesFromPreviewHtml(previewHtml);
  const writtenFiles = writeOutputFiles(outputDir, files);

  const metadata = {
    sourceUrl,
    previewUrl,
    requestedMethod: options.method,
    discoverMethod,
    extractedAt: new Date().toISOString(),
    outputDir,
    fileCount: writtenFiles.length,
    files: writtenFiles.map((file) => ({ name: file.name, bytes: file.bytes })),
    unresolvedReferences: missing,
  };

  fs.writeFileSync(path.join(outputDir, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");

  console.log(`Extracted ${writtenFiles.length} file(s) to ${outputDir}`);
  for (const file of writtenFiles) {
    console.log(`- ${file.name} (${file.bytes} bytes)`);
  }
  if (missing.length > 0) {
    console.log(`Warning: unresolved references -> ${missing.join(", ")}`);
  }
  console.log(`Metadata: ${path.join(outputDir, "metadata.json")}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  console.error("Retry tips:");
  console.error("- Use --method auto for HTTP-first with Playwright fallback.");
  console.error("- Use --method playwright if template parsing is unstable.");
  console.error("- Ensure the URL is a v0 template page or preview URL.");
  process.exit(1);
});
