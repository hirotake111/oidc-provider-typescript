import fs from "fs";
import path from "path";

import { ClientMetadata } from "oidc-provider";
import { JSONWebKeySet } from "jose";
import { IConfigLoader, IConfigLoaderDataType, ICookies } from "../types";

export class ConfigLoader implements IConfigLoader {
  private data: IConfigLoaderDataType;
  private jwks: JSONWebKeySet;

  constructor() {
    const data = fs.readFileSync(path.resolve("src/.env.json"), "utf8");
    this.data = JSON.parse(data);
    this.jwks = JSON.parse(
      fs.readFileSync(path.resolve("src/jwks.json"), "utf8")
    ) as JSONWebKeySet;
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
