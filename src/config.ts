import Provider, { Adapter, Configuration, FindAccount } from "oidc-provider";
import { RedisClient } from "redis";
import { Env } from "./env";
import { getOIDCConfiguration } from "./support/configuration";
import {
  validateClientMetadata,
  validateCookieParams,
  validateJWKS,
} from "./utils/validations";

export const getConfig = async ({
  DATABASE_URI,
  REDIS_URL,
  ISSUER,
  PORT,
  PROD,
  ROUNDS,
  SECRETKEY,
  USER_CREATION_ALLOWED,
  JWKS,
  CLIENTMEDATADA,
  COOKIEPARAMS,
}: Env): Promise<ConfigType> => {
  // console.log("USER_CREATION_ALLOWED,", USER_CREATION_ALLOWED);
  try {
    // OIDC configuration
    const configuration = await getOIDCConfiguration({
      clients: validateClientMetadata(CLIENTMEDATADA),
      cookies: validateCookieParams(COOKIEPARAMS),
      jwks: validateJWKS(JWKS),
    });
    // IORedis client
    // const ioRedisClient = getIORedisClient(REDIS_URL, "iodc:");
    // const redisAdapter = getRedisAdapter(ioRedisClient);

    return {
      DATABASE_URI,
      REDIS_URL,
      // REDIS_CLIENT: getRedisClient(REDIS_URL),
      ISSUER,
      PORT,
      PROD,
      ROUNDS,
      SECRETKEY,
      USER_CREATION_ALLOWED,
      configuration,
      // getProvider: GetOidcProvider(ISSUER, configuration, redisAdapter),
      // provider: undefined,
    };
  } catch (e) {
    throw e;
  }
};

export type ConfigType = {
  DATABASE_URI: string;
  REDIS_URL: string;
  redisClient?: RedisClient;
  ISSUER: string;
  PORT: number;
  PROD: boolean;
  ROUNDS: number;
  SECRETKEY: string;
  USER_CREATION_ALLOWED: boolean;
  configuration: Configuration;
  adapter?: Adapter;
  getProvider?: (findAccount: FindAccount) => Provider;
  provider?: Provider;
};
