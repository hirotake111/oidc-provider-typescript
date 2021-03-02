// npm i ioredis@^4.0.0
import Redis from "ioredis";
import { Adapter, AdapterPayload } from "oidc-provider";
import { REDIS_URL } from "../support/configuration";

const client = new Redis(REDIS_URL, { keyPrefix: "oidc:" });

/* Name of the oidc-provider model. One of "Session", "AccessToken",
 * "AuthorizationCode", "RefreshToken", "ClientCredentials", "Client", "InitialAccessToken",
 * "RegistrationAccessToken", "DeviceCode", "Interaction", "ReplayDetection", or "PushedAuthorizationRequest"
 */
const consumable = new Set(["AuthorizationCode", "RefreshToken", "DeviceCode"]);

/**
 *
 * @param id string
 * @returns "grant:id"
 */
const grantKeyFor = (id: string): string => {
  return `grant:${id}`;
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

  constructor(name: string) {
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
    console.log("upsert()");

    // console.log("payload: ", payload);
    // get key ("name:id")
    const key = this.key(id);
    // if consumable has the name of OIDC model,
    const store = JSON.stringify(payload);
    // const store = consumable.has(this.name)
    //   ? { payload: JSON.stringify(payload) }
    //   : JSON.stringify(payload);

    // create pipeline
    const pipeline = client.multi();
    // set data
    if (consumable.has(this.name)) {
      pipeline.hmset(key, store);
    } else {
      pipeline.set(key, store);
    }
    // set expiration
    pipeline.expire(key, expiresIn);

    // upsert grant key
    if (payload.grantId) {
      const grantKey = grantKeyFor(payload.grantId);
      console.log("grantKey: ", grantKey);
      // Insert all the specified values at the tail
      // of the list stored at key. If key does not exist,
      // it is created as empty list before performing
      // the push operation.
      pipeline.rpush(grantKey, key);
      // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
      // here to trim the list to an appropriate length
      const ttl = await client.ttl(grantKey);
      if (expiresIn > ttl) {
        pipeline.expire(grantKey, expiresIn);
      }
    }

    if (payload.userCode) {
      console.log("upsert user code");
      const userCodeKey = userCodeKeyFor(payload.userCode);
      console.log("userCodeKey: ", userCodeKey);
      pipeline.set(userCodeKey, id);
      pipeline.expire(userCodeKey, expiresIn);
    }

    if (payload.uid) {
      console.log("upsert UID key");
      const uidKey = uidKeyFor(payload.uid);
      console.log("uidKey: ", uidKey);
      pipeline.set(uidKey, id);
      pipeline.expire(uidKey, expiresIn);
    }

    // execute commands
    await pipeline.exec();
  }

  async find(id: string): Promise<AdapterPayload | undefined | void> {
    console.log(
      "find(), this.name: ",
      this.name,
      " consumable has it: ",
      consumable.has(this.name)
    );
    const key = this.key(id);
    console.log("key: ", key);
    const data = consumable.has(this.name)
      ? await client.hgetall(key)
      : await client.get(key);

    if (!data) {
      return undefined;
    }

    console.log("data: ", data);
    if (typeof data === "string") {
      return JSON.parse(data);
    }
    console.warn("data is not string but ", typeof data);
    const { payload, ...rest } = data;
    return {
      ...rest,
      ...JSON.parse(payload),
    };
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined | void> {
    console.log("findByUid()");
    // get ID using UID
    const id = await client.get(uidKeyFor(uid));
    if (id) {
      return this.find(id);
    }
  }

  async findByUserCode(
    userCode: string
  ): Promise<AdapterPayload | undefined | void> {
    console.log("findByUserCode()");
    // get "userCode:userCode" using code
    const id = await client.get(userCodeKeyFor(userCode));
    if (id) {
      return this.find(id);
    }
  }

  async destroy(id: string): Promise<undefined | void> {
    console.log("destroy()");
    const key = this.key(id);
    await client.del(key);
  }

  async revokeByGrantId(grantId: string): Promise<undefined | void> {
    console.log("revokeByGrantId()");
    const multi = client.multi();
    const tokens = await client.lrange(grantKeyFor(grantId), 0, -1);
    tokens.forEach((token) => multi.del(token));
    multi.del(grantKeyFor(grantId));
    await multi.exec();
  }

  async consume(id: string): Promise<undefined | void> {
    console.log("consume()");
    await client.hset(this.key(id), "consumed", Math.floor(Date.now() / 1000));
  }

  /**
   *
   * @param id string
   * @returns "name:id"
   */
  key(id: string): string {
    return `${this.name}:${id}`;
  }
}
