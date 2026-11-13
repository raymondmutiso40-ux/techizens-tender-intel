import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { Redis } from "@upstash/redis";
import { verifySession, COOKIE } from "./auth";

export type Db = { opportunities: any[]; requirements: any[]; proposals: any[]; profile?: any };

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;
const dir = path.join(process.cwd(), "data");

function fix(db: any): Db {
  db ??= {};
  db.opportunities ??= [];
  db.requirements ??= [];
  db.proposals ??= [];
  return db;
}

function writeFile(file: string, data: any) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch {
    throw new Error("No storage configured. Add Upstash Redis in the Vercel Storage tab and redeploy.");
  }
}

async function uid() {
  const s = verifySession((await cookies()).get(COOKIE)?.value);
  if (!s) throw new Error("Not signed in");
  return s.uid;
}

// Each signed-in user has a private workspace.
export async function readDb(): Promise<Db> {
  const id = await uid();
  if (redis) return fix(await redis.get("tender-intel-db:" + id));
  const f = path.join(dir, `db-${id}.json`);
  return fix(fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null);
}

export async function writeDb(db: Db) {
  const id = await uid();
  if (redis) { await redis.set("tender-intel-db:" + id, db); return; }
  writeFile(path.join(dir, `db-${id}.json`), db);
}

export async function findUser(email: string): Promise<any | null> {
  const e = email.toLowerCase();
  if (redis) return ((await redis.hget("tender-intel-users", e)) as any) ?? null;
  const f = path.join(dir, "users.json");
  const all = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  return all[e] ?? null;
}

export async function createUser(user: any): Promise<boolean> {
  if (redis) return (await redis.hsetnx("tender-intel-users", user.email, user)) === 1;
  const f = path.join(dir, "users.json");
  const all = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  if (all[user.email]) return false;
  all[user.email] = user;
  writeFile(f, all);
  return true;
}