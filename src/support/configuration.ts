import dotenv from "dotenv";
import { JSONWebKeySet } from "jose";
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
  KoaContextWithOIDC,
} from "oidc-provider";
import { ICookies } from "../types";

// copies the default policy, already has login and consent prompt policies
const interactions = interactionPolicy.base(); // policy();

// create a requestable prompt with no implicit checks
const selectAccount = new interactionPolicy.Prompt({
  name: "select_account",
  requestable: true,
});

// add to index 0, order goes select_account > login > consent
interactions.add(selectAccount, 0);

export type ClientFactory = () => Promise<ClientMetadata[]>;

export const getOIDCConfiguration = async ({
  clients,
  cookies,
  jwks,
}: {
  clients: ClientMetadata[];
  cookies: ICookies;
  jwks: JSONWebKeySet;
}): Promise<Configuration> => {
  return {
    clients,
    interactions: {
      policy: interactions,
      url(ctx: KoaContextWithOIDC, interaction: any) {
        // eslint-disable-line no-unused-vars
        return `/interaction/${ctx.oidc.uid}`;
      },
    },
    cookies,
    jwks,
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
    ttl: {
      AccessToken: 1 * 60 * 60, // 1 hour in seconds
      AuthorizationCode: 10 * 60, // 10 minutes in seconds
      IdToken: 1 * 60 * 60, // 1 hour in seconds
      DeviceCode: 10 * 60, // 10 minutes in seconds
      RefreshToken: 1 * 24 * 60 * 60, // 1 day in seconds
    },
  };
};
