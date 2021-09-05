import { createClient } from "redis";
import Redis from "ioredis";

export const getRedisClient = (url: string) => {
  return createClient({ url });
};

export const getIORedisClient = (url: string, keyPrefix: string) => {
  return new Redis(url, { keyPrefix });
};
