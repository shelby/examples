import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";
import { Account, AccountAddress, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const PORT = process.env.PORT ?? 3000;
const DB_PATH = path.join(process.cwd(), "drops.json");
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const TTL_MICROS = 30 * 24 * 60 * 60 * 1_000_000;

if (!process.env.SHELBY_ACCOUNT_PRIVATE_KEY) {
  throw new Error("Missing SHELBY_ACCOUNT_PRIVATE_KEY");
}
if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}
if (!process.env.SHELBY_ACCOUNT_ADDRESS) {
  throw new Error("Missing SHELBY_ACCOUNT_ADDRESS");
}

const client = new ShelbyNodeClient({
  network: Network.TESTNET,
  apiKey: process.env.SHELBY_API_KEY,
});

const signer = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.SHELBY_ACCOUNT_PRIVATE_KEY),
});

const accountAddress = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);

interface Drop {
  id: string;
  fileName: string;
  fileSize: number;
  blobName: string;
  sha256: string;
  uploadedAt: string;
  expiresAt: string;
  downloads: number;
}

function loadDB(): Record<string, Drop> {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Record<string, Drop>;
}

function saveDB(db: Record<string, Drop>): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({ dest: UPLOAD_DIR });
const app = express();

app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, "..", "public")));

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const { originalname, path: tmpPath, size } = req.file;
  const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const id = uuidv4().split("-")[0];
  const blobName = `file-sharing/${id}-${safeName}`;
  const fileData = fs.readFileSync(tmpPath);
  const sha256 = crypto.createHash("sha256").update(fileData).digest("hex");
  const expirationMicros = Date.now() * 1000 + TTL_MICROS;

  try {
    await client.upload({
      blobData: fileData,
      signer,
      blobName,
      expirationMicros,
    });

    fs.unlinkSync(tmpPath);

    const drop: Drop = {
      id,
      fileName: originalname,
      fileSize: size,
      blobName,
      sha256,
      uploadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      downloads: 0,
    };

    const db = loadDB();
    db[id] = drop;
    saveDB(db);

    console.log(`✓ Uploaded ${originalname} → ${blobName}`);
    res.json({ success: true, id, sha256, expiresAt: drop.expiresAt });
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/drop/:id", (req, res) => {
  const db = loadDB();
  const drop = db[req.params.id];
  if (!drop) {
    res.status(404).json({ error: "Drop not found" });
    return;
  }
  res.json(drop);
});

app.get("/drop/:id/download", async (req, res) => {
  const db = loadDB();
  const drop = db[req.params.id];
  if (!drop) {
    res.status(404).json({ error: "Drop not found" });
    return;
  }

  try {
    const { readable } = await client.download({
      account: accountAddress,
      blobName: drop.blobName,
    });

    db[drop.id].downloads += 1;
    saveDB(db);

    res.setHeader("Content-Disposition", `attachment; filename="${drop.fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    await pipeline(
      Readable.fromWeb(readable as ReadableStream<Uint8Array>),
      res,
    );
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

app.get("/drops", (_req, res) => {
  const db = loadDB();
  const list = Object.values(db).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
  res.json(list);
});

app.listen(PORT, () => {
  console.log(`\n⚡ Shelby File Sharing running at http://localhost:${PORT}\n`);
});
