import { neon } from "@neondatabase/serverless";
import { kv as vercelKV } from "@vercel/kv";

export const sql = neon(process.env.DATABASE_URL!);
export const kv = vercelKV;