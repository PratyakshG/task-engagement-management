import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const port = Number(process.env.PORT) || 4000;

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received; closing server.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
