import dotenv from "dotenv";
dotenv.config();

export const getRounds = (env: string | undefined) => {
  const n = parseInt(env || "5", 10);
  return n ? n : 5;
};

export const DATABASE_URI =
  process.env.DATABASE_URI || "NODATABASECONNECTIONSTRING";
export const REDIS_URL = process.env.REDIS_URL || "NOREDISURL";
export const ISSUER = process.env.ISSUER || "NOISSUER";
export const PORT = process.env.PORT || 3000; // Port number
export const PROD = process.env.NODE_ENV === "production";
export const ROUNDS = getRounds(process.env.ROUNDS); // used for password hashing
export const SECRETKEY = process.env.SECRETKEY || "supersecret";
