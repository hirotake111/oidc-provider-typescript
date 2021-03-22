import { ClientMetadata, CookiesSetOptions } from "oidc-provider";
import { JSONWebKeySet } from "jose";
import { IConfigLoader, IConfigLoaderDataType, ICookies } from "../types";

export class ConfigLoaderEnv implements IConfigLoader {
  private data: IConfigLoaderDataType;
  private jwks: JSONWebKeySet;

  constructor() {
    console.log("==== LOADING CONFIGURATION FROM ENVIRONMENT VARIABLES ===");
    this.data = JSON.parse(
      process.env.OIDCCONFIGURATION || "{}"
    ) as IConfigLoaderDataType;
    this.jwks = JSON.parse(process.env.JWKS || "{}") as JSONWebKeySet;
  }

  public getClients = (): ClientMetadata[] => {
    if (!this.data.clients) {
      throw new Error("NO CLIENTS FOUND IN DATA");
    }
    return this.data.clients;
  };

  public getCookies = (): ICookies | undefined => this.data.cookies;

  public getJwks = (): JSONWebKeySet => this.jwks;
}
