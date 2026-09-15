import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
});

console.log("DATABASE_URL loaded:", Boolean(process.env.DATABASE_URL));
console.log("DIRECT_URL loaded:", Boolean(process.env.DIRECT_URL));
