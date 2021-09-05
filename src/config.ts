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
  REDIS_CONNECTION_TLS,
  POSTGRES_CONNECTION_TLS,
}: Env): Promise<ConfigType> => {
  try {
    // OIDC configuration
    const configuration = await getOIDCConfiguration({
      clients: validateClientMetadata(CLIENTMEDATADA),
      cookies: validateCookieParams(COOKIEPARAMS),
      jwks: validateJWKS(JWKS),
    });

    return {
      DATABASE_URI,
      REDIS_URL,
      REDIS_CONNECTION_TLS,
      POSTGRES_CONNECTION_TLS,
      ISSUER,
      PORT,
      PROD,
      ROUNDS,
      SECRETKEY,
      USER_CREATION_ALLOWED,
      configuration,
    };
  } catch (e) {
    throw e;
  }
};

export type ConfigType = {
  DATABASE_URI: string;
  REDIS_URL: string;
  REDIS_CONNECTION_TLS: boolean;
  POSTGRES_CONNECTION_TLS: boolean;
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
