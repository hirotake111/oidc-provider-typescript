import dotenv from "dotenv";
import { getIORedisClient, getRedisClient } from "./support/getRedisClient";
dotenv.config();

export const getRounds = (env: string | undefined) => {
  const n = parseInt(env || "5", 10);
  return n ? n : 5;
};

const DATABASE_URI = process.env.DATABASE_URI || "NODATABASECONNECTIONSTRING";
const REDIS_URL = process.env.REDIS_URL || "NOREDISURL";
const ISSUER = process.env.ISSUER || "NOISSUER";
const PORT = process.env.PORT || 3000; // Port number
const PROD = process.env.NODE_ENV === "production";
const ROUNDS = getRounds(process.env.ROUNDS); // used for password hashing
const SECRETKEY = process.env.SECRETKEY || "supersecret";
const USER_CREATION_ALLOWED = !!process.env.USER_CREATION_ALLOWED;

const defaultConfig = {
  DATABASE_URI: "NODATABASECONNECTIONSTRING",
  REDIS_CLIENT: undefined,
  IOREDIS_CLIENT: undefined,
  ISSUER: "NOISSUER",
  PORT: 3000,
  PROD: false,
  ROUND: getRounds(process.env.ROUNDS), // used for password hashing
  SECRETKEY: "supersecret",
  USER_CREATION_ALLOWED: true,
};

export const config = {
  ...defaultConfig,
  DATABASE_URI,
  REDIS_CLIENT: getRedisClient(REDIS_URL),
  IOREDIS_CLIENT: getIORedisClient(REDIS_URL, "iodc:"),
  ISSUER,
  PORT,
  PROD,
  ROUNDS,
  SECRETKEY,
  USER_CREATION_ALLOWED,
};

export type ConfigType = typeof config;
