import dotenv, { config } from "dotenv";
dotenv.config();

interface ICtx {
  oidc: {
    uid: string;
  };
}

// const {
//   interactionPolicy: { Prompt, base: policy },
// } = require("../../lib"); // require('oidc-provider');
import {
  ClientMetadata,
  Configuration,
  interactionPolicy,
} from "oidc-provider";
import { ConfigLoader } from "./configLoader";

export const getRounds = (env: string | undefined) => {
  const n = parseInt(env || "5", 10);
  return n ? n : 5;
};

const DATABASE_URI = process.env.DATABASE_URI || "NODATABASECONNECTIONSTRING";
const REDIS_URL = process.env.REDIS_URL || "NOREDISURL";
const ISSUER = process.env.ISSUER || "NOISSUER";
const PORT = process.env.PORT || 3000; // Port number
const PROD = process.env.NODE_ENV === "production";
const ROUNDS = getRounds(process.env.ROUNDS); // used for password hashing
const SECRETKEY = process.env.SECRETKEY || "supersecret";

// copies the default policy, already has login and consent prompt policies
const interactions = interactionPolicy.base(); // policy();

// create a requestable prompt with no implicit checks
const selectAccount = new interactionPolicy.Prompt({
  name: "select_account",
  requestable: true,
});

// add to index 0, order goes select_account > login > consent
interactions.add(selectAccount, 0);

interface IClientType {
  client_id: string;
  client_secret: string;
  grant_types: string[];
  redirect_uris: string[];
}

export type ClientFactory = () => Promise<ClientMetadata[]>;

export const configurationFactory = async (
  configLoader: ConfigLoader
): Promise<Configuration> => {
  const clients = configLoader.getClients();
  const cookies = configLoader.getCookies();
  const jwks = configLoader.getJwks();
  return {
    clients,
    interactions: {
      policy: interactions,
      url(ctx: ICtx) {
        // eslint-disable-line no-unused-vars
        return `/interaction/${ctx.oidc.uid}`;
      },
    },
    cookies,
    claims: {
      address: ["address"],
      email: ["email", "email_verified"],
      phone: ["phone_number", "phone_number_verified"],
      profile: [
        "birthdate",
        "family_name",
        "gender",
        "given_name",
        "locale",
        "middle_name",
        "name",
        "nickname",
        "picture",
        "preferred_username",
        "profile",
        "updated_at",
        "website",
        "zoneinfo",
      ],
    },
    features: {
      devInteractions: { enabled: false }, // defaults to true

      deviceFlow: { enabled: false }, // defaults to false
      introspection: { enabled: false }, // defaults to false
      revocation: { enabled: false }, // defaults to false
    },
    jwks,
    ttl: {
      AccessToken: 1 * 60 * 60, // 1 hour in seconds
      AuthorizationCode: 10 * 60, // 10 minutes in seconds
      IdToken: 1 * 60 * 60, // 1 hour in seconds
      DeviceCode: 10 * 60, // 10 minutes in seconds
      RefreshToken: 1 * 24 * 60 * 60, // 1 day in seconds
    },
  };
};

export { DATABASE_URI, REDIS_URL, ISSUER, PORT, PROD, ROUNDS, SECRETKEY };
