import { defineConfig, env } from "prisma/config";

// Prisma CLI settings (migrations, seeding). Loads .env.local like Next.js does.
process.loadEnvFile?.(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
