import { JSONWebKeySet } from "jose";
import { IConfigLoader, IConfigLoaderDataType } from "../types";

export const ConfigLoaderEnv = (
  config: IConfigLoaderDataType,
  jwks: JSONWebKeySet
): IConfigLoader => {
  return {
    getClients() {
      if (!config.clients)
        throw new Error("No clients found in OIDCCONFIGURATION");
      return config.clients;
    },
    getCookies() {
      return config.cookies;
    },
    getJwks() {
      return jwks;
    },
  };

  // private data: IConfigLoaderDataType;
  // private jwks: JSONWebKeySet;

  // constructor() {
  //   console.log("==== LOADING CONFIGURATION FROM ENVIRONMENT VARIABLES ===");
  //   this.data = JSON.parse(
  //     process.env.OIDCCONFIGURATION || "{}"
  //   ) as IConfigLoaderDataType;
  //   this.jwks = JSON.parse(process.env.JWKS || "{}") as JSONWebKeySet;
  // }

  // public getClients = (): ClientMetadata[] => {
  // if (!this.data.clients) {
  //     throw new Error("NO CLIENTS FOUND IN DATA");
  //   }
  //   return this.data.clients;
  // };

  // public getCookies = (): ICookies | undefined => this.data.cookies;

  // public getJwks = (): JSONWebKeySet => this.jwks;
};
