// packages/shared/src/index.ts
import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

// 1. Grab your runtime DATABASE_URL string (Transaction pooler)
const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing.");
}

// 2. Set up the pg Pool
const pool = new pg.Pool({ connectionString });

// 3. Bind it to Prisma 7's required adapter
const adapter = new PrismaPg(pool);

// 4. Construct PrismaClient with the adapter configuration
export const prisma = new PrismaClient({ adapter });

export * from "./types/auth";

