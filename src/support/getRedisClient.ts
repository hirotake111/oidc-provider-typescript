import redis from "redis";
import Redis from "ioredis";

export const getRedisClient = (url: string) => {
  return redis.createClient({ url });
};

export const getIORedisClient = (url: string, keyPrefix: string) => {
  return new Redis(url, { keyPrefix });
};
