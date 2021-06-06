import dotenv from "dotenv";
dotenv.config();

interface ICtx {
  oidc: {
    uid: string;
  };
}

import {
  ClientMetadata,
  Configuration,
  interactionPolicy,
} from "oidc-provider";
import { IConfigLoader } from "../types";
import { ConfigLoader } from "./configLoader";

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
  configLoader: IConfigLoader
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
        "display_name",
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
