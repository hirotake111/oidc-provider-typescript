import dotenv from "dotenv";
import IORedis from "ioredis";
import { JSONWebKeySet } from "jose";
import Provider, { Configuration, FindAccount } from "oidc-provider";
import { RedisClient } from "redis";
import { getRedisAdapter } from "./adapters/redisAdapter";
import { ConfigLoaderEnv } from "./support/configLoaderEnv";
import { configurationFactory } from "./support/configuration";
import { getIORedisClient, getRedisClient } from "./support/getRedisClient";
import { oidcProviderFactory } from "./support/oidcProviderFactory";
import { IConfigLoaderDataType } from "./types";
dotenv.config();

export const getRounds = (env: string | undefined) => {
  const n = parseInt(env || "5", 10);
  return n ? n : 5;
};

const DATABASE_URI = process.env.DATABASE_URI || "NODATABASECONNECTIONSTRING";
const REDIS_URL = process.env.REDIS_URL || "NOREDISURL";
const ISSUER = process.env.ISSUER || "NOISSUER";
const PORT = parseInt(process.env.PORT || "3000"); // Port number
const PROD = process.env.NODE_ENV === "production";
const ROUNDS = getRounds(process.env.ROUNDS); // used for password hashing
const SECRETKEY = process.env.SECRETKEY || "supersecret";
const USER_CREATION_ALLOWED = !!process.env.USER_CREATION_ALLOWED;

export const getConfig = async (): Promise<ConfigType> => {
  console.log(`user creation allowed: ${USER_CREATION_ALLOWED}`);
  console.log("JWKS:", process.env.JWKS);
  console.log("parsed: ", JSON.parse(process.env.JWKS || "{}"));
  const OIDCCONFIGURATION = JSON.parse(
    process.env.OIDCCONFIGURATION || "{}"
  ) as IConfigLoaderDataType;
  const JWKS = JSON.parse(process.env.JWKS || "{}") as JSONWebKeySet;
  try {
    const configuration = await configurationFactory(
      ConfigLoaderEnv(OIDCCONFIGURATION, JWKS)
    );
    // redis client
    const redisClient = getRedisClient(REDIS_URL);
    // IORedis client
    const ioRedisClient = getIORedisClient(REDIS_URL, "iodc:");
    const redisAdapter = getRedisAdapter(ioRedisClient);
    const getProvider = oidcProviderFactory(
      ISSUER,
      configuration,
      redisAdapter
    );

    return {
      DATABASE_URI,
      REDIS_CLIENT: redisClient,
      IOREDIS_CLIENT: ioRedisClient,
      ISSUER,
      OIDCCONFIGURATION,
      JWKS,
      PORT,
      PROD,
      ROUNDS,
      SECRETKEY,
      USER_CREATION_ALLOWED,
      configuration,
      getProvider,
      provider: undefined,
    };
  } catch (e) {
    throw e;
  }
};

export type ConfigType = {
  DATABASE_URI: string;
  REDIS_CLIENT: RedisClient;
  IOREDIS_CLIENT: IORedis.Redis;
  ISSUER: string;
  JWKS: JSONWebKeySet;
  PORT: number;
  PROD: boolean;
  ROUNDS: number;
  SECRETKEY: string;
  OIDCCONFIGURATION: IConfigLoaderDataType;
  USER_CREATION_ALLOWED: boolean;
  configuration: Configuration;
  getProvider: (findAccount: FindAccount) => Provider;
  provider: Provider | undefined;
};
