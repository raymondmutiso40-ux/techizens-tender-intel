import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "db.json");
export type Db = { opportunities: any[]; requirements: any[]; proposals: any[] };

export function readDb(): Db {
  if (!fs.existsSync(FILE)) return { opportunities: [], requirements: [], proposals: [] };
  const db = JSON.parse(fs.readFileSync(FILE, "utf8"));
  db.opportunities ??= [];
  db.requirements ??= [];
  db.proposals ??= [];
  return db;
}
export function writeDb(db: Db) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}