// npm i ioredis@^4.0.0
import Redis from "ioredis";
import { Adapter, AdapterPayload } from "oidc-provider";
import { REDIS_URL } from "../config";

const client = new Redis(REDIS_URL, { keyPrefix: "oidc:" });

const consumable = new Set(["AuthorizationCode", "RefreshToken", "DeviceCode"]);

/**
 *
 * @param id string
 * @returns "grant:id"
 */
const grantKeyFor = (id: string): string => {
  const key = `grant:${id}`;
  // console.log(`grant key: ${key}`);
  return key;
};

/**
 *
 * @param userCode string
 * @returns "userCode:userCode"
 */
function userCodeKeyFor(userCode: string) {
  return `userCode:${userCode}`;
}

/**
 *
 * @param uid string
 * @returns "uid:id"
 */
function uidKeyFor(uid: string) {
  return `uid:${uid}`;
}

export class RedisAdapter implements Adapter {
  private name: string;

  /**
   *
   * Creates an instance of MyAdapter for an oidc-provider model.
   *
   * @constructor
   * @param {string} name Name of the oidc-provider model. One of "Grant, "Session", "AccessToken",
   * "AuthorizationCode", "RefreshToken", "ClientCredentials", "Client", "InitialAccessToken",
   * "RegistrationAccessToken", "DeviceCode", "Interaction", "ReplayDetection", or "PushedAuthorizationRequest"
   *
   */
  constructor(name: string) {
    this.name = name;
  }

  async upsert(
    id: string,
    payload: AdapterPayload,
    expiresIn: number
  ): Promise<undefined | void> {
    try {
      // get key
      const key = this.key(id);
      // create pipeline
      const pipeline = client.multi();
      // upsert payload data
      if (consumable.has(this.name)) {
        pipeline.hset(key, { payload: JSON.stringify(payload) });
      } else {
        pipeline.set(key, JSON.stringify(payload));
      }

      // set expiration
      if (expiresIn) {
        pipeline.expire(key, expiresIn);
      }

      // upsert grant key
      if (payload.grantId) {
        const grantKey = grantKeyFor(payload.grantId);
        // Insert all the specified values at the tail of the list stored at key. If key does not exist,
        // it is created as empty list before performing the push operation.
        pipeline.rpush(grantKey, key);
        // console.log(`upsert grant key ${grantKey}, name: ${this.name}`);
        // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
        // here to trim the list to an appropriate length
        const ttl = await client.ttl(grantKey);
        if (expiresIn && expiresIn > ttl) {
          pipeline.expire(grantKey, expiresIn);
        }
      }

      // upsert user code
      if (payload.userCode) {
        const userCodeKey = userCodeKeyFor(payload.userCode);
        pipeline.set(userCodeKey, id);
        if (expiresIn) {
          pipeline.expire(userCodeKey, expiresIn);
        }
      }

      // upsert UID
      if (payload.uid) {
        const uidKey = uidKeyFor(payload.uid);
        pipeline.set(uidKey, id);
        if (expiresIn) {
          pipeline.expire(uidKey, expiresIn);
        }
      }

      // execute commands
      await pipeline.exec();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async find(id: string): Promise<AdapterPayload | undefined | void> {
    try {
      // get key
      const key = this.key(id);
      const data = consumable.has(this.name)
        ? await client.hgetall(key)
        : await client.get(key);
      if (!data) {
        return undefined;
      }
      if (typeof data === "string") {
        return JSON.parse(data);
      }
      // typeof data: Record<string, string>
      const { payload, ...rest } = data;
      return { ...rest, ...JSON.parse(payload) };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined | void> {
    try {
      // get ID using UID
      const id = await client.get(uidKeyFor(uid));
      const data = id ? await this.find(id) : null;
      if (data) {
        return data;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async findByUserCode(
    userCode: string
  ): Promise<AdapterPayload | undefined | void> {
    try {
      const id = await client.get(userCodeKeyFor(userCode));
      if (id) {
        return this.find(id);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async destroy(id: string): Promise<undefined | void> {
    try {
      const key = this.key(id);
      await client.del(key);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async revokeByGrantId(grantId: string): Promise<undefined | void> {
    try {
      const pipeline = client.multi();
      const tokens = await client.lrange(grantKeyFor(grantId), 0, -1);
      tokens.forEach((token) => pipeline.del(token));
      pipeline.del(grantKeyFor(grantId));
      await pipeline.exec();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   *
   * Mark a stored oidc-provider model as consumed (not yet expired though!). Future finds for this
   * id should be fulfilled with an object containing additional property named "consumed" with a
   * truthy value (timestamp, date, boolean, etc).
   *
   * @return {Promise} Promise fulfilled when the operation succeeded. Rejected with error when
   * encountered.
   * @param {string} id Identifier of oidc-provider model
   *
   */
  async consume(id: string): Promise<undefined | void> {
    try {
      const key = this.key(id);
      // set consumed field with current time
      await client.hset(key, {
        consumed: Math.floor(Date.now() / 1000).toString(),
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   *
   * @param id string
   * @returns key string "name:id"
   */
  key(id: string): string {
    const key = `${this.name}:${id}`;
    // console.log(`key: ${key}`);
    return key;
  }
}
