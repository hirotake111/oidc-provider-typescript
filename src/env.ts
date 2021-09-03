import dotenv from "dotenv";
import { getRounds } from "./utils/utils";

dotenv.config();

const env = {
  DATABASE_URI: process.env.DATABASE_URI || "NODATABASECONNECTIONSTRING",
  REDIS_URL: process.env.REDIS_URL || "NOREDISURL",
  ISSUER: process.env.ISSUER || "NOISSUER",
  PORT: parseInt(process.env.PORT || "3000", 10), // Port number
  PROD: process.env.NODE_ENV === "production",
  ROUNDS: getRounds(process.env.ROUNDS), // used for password hashing
  SECRETKEY: process.env.SECRETKEY || "supersecret",
  USER_CREATION_ALLOWED: !!process.env.USER_CREATION_ALLOWED,
  JWKS: JSON.parse(process.env.JWKS || "{}"),
  CLIENTMEDATADA: JSON.parse(process.env.CLIENTMEDATADA || "[]"),
  COOKIEPARAMS: JSON.parse(process.env.COOKIEPARAMS || "{}"),
};

type Env = typeof env;

export { env, Env };
