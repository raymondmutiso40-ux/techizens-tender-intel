import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

export type Db = { opportunities: any[]; requirements: any[]; proposals: any[]; profile?: any };

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;
const KEY = "tender-intel-db";
const FILE = path.join(process.cwd(), "data", "db.json");

function fix(db: any): Db {
  db ??= {};
  db.opportunities ??= [];
  db.requirements ??= [];
  db.proposals ??= [];
  return db;
}

export async function readDb(): Promise<Db> {
  if (redis) return fix(await redis.get(KEY));
  if (!fs.existsSync(FILE)) return fix(null);
  return fix(JSON.parse(fs.readFileSync(FILE, "utf8")));
}

export async function writeDb(db: Db) {
  if (redis) { await redis.set(KEY, db); return; }
  try {
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
  } catch {
    throw new Error("No storage configured. Add Upstash Redis in the Vercel Storage tab and redeploy.");
  }
}
