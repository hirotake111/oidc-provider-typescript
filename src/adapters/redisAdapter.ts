// npm i ioredis@^4.0.0
import Redis from "ioredis";
import { Adapter, AdapterPayload } from "oidc-provider";
import { REDIS_URL } from "../support/configuration";

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
    // console.log(`Instanciate Adapter(${name})`);
    this.name = name;
  }

  /**
   *
   * When this is one of AccessToken, AuthorizationCode, RefreshToken, ClientCredentials,
   * InitialAccessToken, RegistrationAccessToken or DeviceCode the payload will contain the
   * following properties depending on the used `formats` value for the given token (or default).
   *
   * Note: This list is not exhaustive and properties may be added in the future, it is highly
   * recommended to use a schema that allows for this.
   *
   * when `opaque` (default)
   * - jti {string} - unique identifier of the token
   * - kind {string} - token class name
   * - format {string} - the format used for the token storage and representation
   * - exp {number} - timestamp of the token's expiration
   * - iat {number} - timestamp of the token's creation
   * - accountId {string} - account identifier the token belongs to
   * - clientId {string} - client identifier the token belongs to
   * - aud {string[]} - array of audiences the token is intended for
   * - authTime {number} - timestamp of the end-user's authentication
   * - claims {object} - claims parameter (see claims in OIDC Core 1.0), rejected claims
   *     are, in addition, pushed in as an Array of Strings in the `rejected` property.
   * - extra {object} - extra claims returned by the extraAccessTokenClaims helper
   * - codeChallenge {string} - client provided PKCE code_challenge value
   * - codeChallengeMethod {string} - client provided PKCE code_challenge_method value
   * - sessionUid {string} - uid of a session this token stems from
   * - expiresWithSession {boolean} - whether the token is valid when session expires
   * - grantId {string} - grant identifier, tokens with the same value belong together
   * - nonce {string} - random nonce from an authorization request
   * - redirectUri {string} - redirect_uri value from an authorization request
   * - resource {string} - granted or requested resource indicator value (auth code, device code, refresh token)
   * - rotations {number} - [RefreshToken only] - number of times the refresh token was rotated
   * - iiat {number} - [RefreshToken only] - the very first (initial) issued at before rotations
   * - acr {string} - authentication context class reference value
   * - amr {string[]} - Authentication methods references
   * - scope {string} - scope value from an authorization request, rejected scopes are removed
   *     from the value
   * - sid {string} - session identifier the token comes from
   * - 'x5t#S256' {string} - X.509 Certificate SHA-256 Thumbprint of a certificate bound access or
   *     refresh token
   * - 'jkt' {string} - JWK SHA-256 Thumbprint (according to [RFC7638]) of a DPoP bound
   *     access or refresh token
   * - gty {string} - [AccessToken, RefreshToken only] space delimited grant values, indicating
   *     the grant type(s) they originate from (implicit, authorization_code, refresh_token or
   *     device_code) the original one is always first, second is refresh_token if refreshed
   * - params {object} - [DeviceCode only] an object with the authorization request parameters
   *     as requested by the client with device_authorization_endpoint
   * - userCode {string} - [DeviceCode only] user code value
   * - deviceInfo {object} - [DeviceCode only] an object with details about the
   *     device_authorization_endpoint request
   * - inFlight {boolean} - [DeviceCode only]
   * - error {string} - [DeviceCode only] - error from authnz to be returned to the polling client
   * - errorDescription {string} - [DeviceCode only] - error_description from authnz to be returned
   *     to the polling client
   * - policies {string[]} - [InitialAccessToken, RegistrationAccessToken only] array of policies
   * - request {string} - [PushedAuthorizationRequest only] Pushed Request Object value
   *
   *
   * when `jwt`
   * - same as `opaque` with the addition of
   * - jwt {string} - the JWT value returned to the client
   *
   * when `jwt-ietf`
   * - same as `opaque` with the addition of
   * - 'jwt-ietf' {string} - the JWT value returned to the client
   *
   * when `paseto`
   * - same as `opaque` with the addition of
   * - paseto {string} - the PASETO value returned to the client
   *
   * Client model will only use this when registered through Dynamic Registration features and
   * will contain all client properties.
   *
   * OIDC Session model payload contains the following properties:
   * - jti {string} - Session's unique identifier, it changes on some occasions
   * - uid {string} - Session's unique fixed internal identifier
   * - kind {string} - "Session" fixed string value
   * - exp {number} - timestamp of the session's expiration
   * - iat {number} - timestamp of the session's creation
   * - account {string} - the session account identifier
   * - authorizations {object} - object with session authorized clients and their session identifiers
   * - loginTs {number} - timestamp of user's authentication
   * - acr {string} - authentication context class reference value
   * - amr {string[]} - Authentication methods references
   * - transient {boolean} - whether the session is using a persistant or session cookie
   * - state: {object} - temporary objects used for one-time csrf and state persistance between
   *     form submissions
   *
   * Short-lived Interaction model payload contains the following properties:
   * - jti {string} - unique identifier of the interaction session
   * - kind {string} - "Interaction" fixed string value
   * - exp {number} - timestamp of the interaction's expiration
   * - iat {number} - timestamp of the interaction's creation
   * - uid {string} - the uid of the authorizing client's established session
   * - returnTo {string} - after resolving interactions send the user-agent to this url
   * - params {object} - parsed recognized parameters object
   * - lastSubmission {object} - previous interaction result submission
   * - signed {string[]} - parameter names that come from a trusted source
   * - result {object} - interaction results object is expected here
   * - session {object}
   * - session.uid {string} - uid of the session this Interaction belongs to
   * - session.cookie {string} - jti of the session this Interaction belongs to
   * - session.acr {string} - existing acr of the session Interaction belongs to
   * - session.amr {string[]} - existing amr of the session Interaction belongs to
   * - session.accountId {string} - existing account id from the seession Interaction belongs to
   *
   * Replay prevention ReplayDetection model contains the following properties:
   * - jti {string} - unique identifier of the replay object
   * - kind {string} - "ReplayDetection" fixed string value
   * - exp {number} - timestamp of the replay object cache expiration
   * - iat {number} - timestamp of the replay object cache's creation
   */
  async upsert(
    id: string,
    payload: AdapterPayload,
    expiresIn: number
  ): Promise<undefined | void> {
    // console.log(`upsert(id: ${id}, name: ${this.name})`);
    // console.log("payload: ", payload);
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
        // console.log("upsert UID key");
        const uidKey = uidKeyFor(payload.uid);
        // console.log(`upsert uidKey: ${uidKey}, ${id}, name: ${this.name}`);
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
    // console.log(`find(id: ${id}), name: ${this.name}`);
    try {
      // get key
      const key = this.key(id);
      const data = consumable.has(this.name)
        ? await client.hgetall(key)
        : await client.get(key);
      // console.log("data: ", data);
      if (!data) {
        return undefined;
      }
      if (typeof data === "string") {
        return JSON.parse(data);
      }
      const { payload, ...rest } = data;
      return { ...rest, ...JSON.parse(payload) };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined | void> {
    // get ID using UID
    try {
      const id = await client.get(uidKeyFor(uid));
      // console.log(`findByUid(uid: ${uid}), name: ${this.name}, got ID: ${id}`);
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
    // console.log(`findByUserCode(code: ${userCode}), name: ${this.name}`);
    // get "userCode:userCode" using code
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
    const key = this.key(id);
    // console.log(`destroy(id: ${id}), name: ${this.name} -> destroy ${key}`);
    try {
      await client.del(key);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async revokeByGrantId(grantId: string): Promise<undefined | void> {
    // console.log(`revokeByGrantId(grantId: ${grantId}), name: ${this.name}`);
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
    // console.log(`${this.name}: consume(id: ${id})`);
    const key = this.key(id);
    // console.log(`key: ${key}`);
    try {
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
