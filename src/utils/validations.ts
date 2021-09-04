import { JSONWebKeySet } from "jose";
import { ClientMetadata } from "oidc-provider";
import { ICookies } from "../types";

export const validateClientMetadata = (clients: any): ClientMetadata[] => {
  const data = clients as ClientMetadata[];
  const errorMessage = `Invalid clientMetadata[]: ${JSON.stringify(clients)}`;
  if (!(Array.isArray(data) && data.length > 0)) throw new Error(errorMessage);
  const client = data[0];
  if (!client.client_id) throw new Error(errorMessage);
  if (
    !(
      Array.isArray(client.redirect_uris) &&
      typeof client.redirect_uris[0] === "string"
    )
  )
    throw new Error(errorMessage);
  return data;
};

export const validateCookieParams = (cookieParams: any): ICookies => {
  const data = cookieParams as ICookies;
  const err = `Invalid CookieParams: ${cookieParams}`;

  if (!data) throw new Error(err);
  if (!(data.long && data.short)) throw new Error(err);
  return data;
};

export const validateJWKS = (jwks: any): JSONWebKeySet => {
  const data = jwks as JSONWebKeySet;
  const err = `Invalid JSONWebKeySet object: ${data}`;
  const ecCurves = ["P-256", "P-384", "P-521", "secp256k1"];
  const okpCurves = ["Ed25519", "Ed448", "X25519", "X448"];
  if (!(data && data.keys)) throw new Error(err);

  const key = data.keys[0];
  switch (key.kty) {
    case "EC":
      if (!(key.crv && key.x && key.y && ecCurves.includes(key.crv)))
        throw new Error(err);
      break;

    case "OKP":
      if (!(key.crv && key.x && okpCurves.includes(key.crv)))
        throw new Error(err);
      break;

    case "RSA":
      if (!(key.e && key.n)) throw new Error(err);
      break;

    case "oct":
      break;

    default:
      throw new Error(err);
  }

  return data;
};
