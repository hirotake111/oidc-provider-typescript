import { JSONWebKeySet } from "jose";
import { ClientMetadata, CookiesSetOptions } from "oidc-provider";

// custom type declarations
export interface IClientType {
  client_id: string;
  client_secret: string;
  grant_types: string[];
  redirect_uris: string[];
}

export interface ICookies {
  names?: {
    session?: string;
    interaction?: string;
    resume?: string;
    state?: string;
  };
  long?: CookiesSetOptions;
  short?: CookiesSetOptions;
  keys?: (string | Buffer)[];
}

export interface IConfigLoaderDataType {
  clients: ClientMetadata[];
  cookies?: ICookies;
}

export interface IConfigLoader {
  getClients(): ClientMetadata[];
  getCookies(): ICookies | undefined;
  getJwks(): JSONWebKeySet;
}
