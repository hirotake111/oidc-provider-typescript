import { JSONWebKeySet } from "jose";
import { nanoid } from "nanoid";
import { ICookies } from "../types";
import {
  validateClientMetadata,
  validateCookieParams,
  validateJWKS,
} from "./validations";

describe("validteJWKS", () => {
  it("should validate data", () => {
    expect.assertions(4);
    // RSA key
    const rsa: JSONWebKeySet = { keys: [{ kty: "RSA", e: "xx", n: "xx" }] };
    expect(validateJWKS(rsa)).toEqual(rsa);
    // EC key
    const ec: JSONWebKeySet = {
      keys: [{ kty: "EC", crv: "secp256k1", x: "x", y: "y" }],
    };
    expect(validateJWKS(ec)).toEqual(ec);
    // OKP key
    const okp: JSONWebKeySet = { keys: [{ kty: "OKP", crv: "X448", x: "x" }] };
    expect(validateJWKS(okp)).toEqual(okp);
    // oct key
    const oct: JSONWebKeySet = { keys: [{ kty: "oct" }] };
    expect(validateJWKS(oct)).toEqual(oct);
  });

  it("should thow an error if data is invalid", () => {
    expect.assertions(5);
    // empty object
    const emptyObject = {};
    try {
      validateJWKS(emptyObject);
    } catch (e) {
      expect(e.message).toEqual(`Invalid JSONWebKeySet object: ${emptyObject}`);
    }
    // number
    const num = JSON.stringify(12345);
    try {
      validateJWKS(num);
    } catch (e) {
      expect(e.message).toEqual(`Invalid JSONWebKeySet object: ${num}`);
    }
    // invalid EC key
    const ec = { keys: [{ kty: "EC", x: "x", y: "y", crv: true }] };
    try {
      validateJWKS(ec);
    } catch (e) {
      expect(e.message).toEqual(`Invalid JSONWebKeySet object: ${ec}`);
    }
    // invlalid OKP key
    const okp = { keys: [{ kty: "OKP", crv: "xxx", x: "x" }] };
    try {
      validateJWKS(okp);
    } catch (e) {
      expect(e.message).toEqual(`Invalid JSONWebKeySet object: ${okp}`);
    }
    //
    // invlalid RSA key
    const rsa = { keys: [{ kty: "RSA", n: "n" }] };
    try {
      validateJWKS(rsa);
    } catch (e) {
      expect(e.message).toEqual(`Invalid JSONWebKeySet object: ${rsa}`);
    }
  });

  it("should throw an error if data is undefined", () => {
    expect.assertions(1);
    try {
      validateJWKS(undefined);
    } catch (e) {
      expect(e.message).toEqual(`Invalid JSONWebKeySet object: undefined`);
    }
  });
});

describe("validateClientMetadata", () => {
  it("should validate data", () => {
    expect.assertions(1);
    const clients = [{ client_id: nanoid(), redirect_uris: [nanoid()] }];
    try {
      expect(validateClientMetadata(clients)).toEqual(clients);
    } catch (e) {
      console.error(e.message);
    }
  });

  it("should validate empty array", () => {
    expect.assertions(1);
    try {
      validateClientMetadata([]);
    } catch (e) {
      expect(e.message).toEqual("Invalid clientMetadata[]: []");
    }
  });

  it("should validate invalid data", () => {
    expect.assertions(4);
    // client with no client_id
    try {
      validateClientMetadata([{ redirect_uris: ["https://example.com"] }]);
    } catch (e) {
      expect(e.message).toEqual(
        `Invalid clientMetadata[]: ${JSON.stringify([
          { redirect_uris: ["https://example.com"] },
        ])}`
      );
    }
    // client with no redirect_uris
    try {
      validateClientMetadata([{ client_id: "xxxx" }]);
    } catch (e) {
      expect(e.message).toEqual(
        `Invalid clientMetadata[]: ${JSON.stringify([{ client_id: "xxxx" }])}`
      );
    }
    // client is number
    try {
      validateClientMetadata(12345);
    } catch (e) {
      expect(e.message).toEqual(`Invalid clientMetadata[]: ${12345}`);
    }
    // client is undefined
    try {
      validateClientMetadata(undefined);
    } catch (e) {
      expect(e.message).toEqual(`Invalid clientMetadata[]: ${undefined}`);
    }
  });
});

describe("validateCookieParams", () => {
  it("should validate data", () => {
    expect.assertions(1);
    const params: ICookies = { long: {}, short: {} };
    expect(validateCookieParams(params)).toEqual(params);
  });

  it("should validate invalid data", () => {
    expect.assertions(2);
    // undefined
    try {
      validateCookieParams(undefined);
    } catch (e) {
      expect(e.message).toEqual(`Invalid CookieParams: ${undefined}`);
    }
    // no long attribute
    const invalid = { short: {} };
    try {
      validateCookieParams(invalid);
    } catch (e) {
      expect(e.message).toEqual(`Invalid CookieParams: ${invalid}`);
    }
  });
});
