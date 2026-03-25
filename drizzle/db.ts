// import { getXataClient } from "@/xata";
// import { drizzle } from "drizzle-orm/xata-http";

// const xata = getXataClient();

// export const db = drizzle(xata);

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);