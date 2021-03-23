import { nanoid } from "nanoid";
import { ClientMetadata, KoaContextWithOIDC } from "oidc-provider";
import { configurationFactory } from "./configuration";
import { getRounds } from "../config";

const clients = [
  {
    client_id: "a",
    client_secret: "b",
    grant_types: ["refresh_token", "authorization_code"],
    redirect_uris: ["http://example.com/callback"],
  },
  {
    client_id: "c",
    client_secret: "d",
    grant_types: ["refresh_token", "authorization_code"],
    redirect_uris: ["http://example.com.au/callback"],
  },
];

const context = {
  oidc: {
    uid: nanoid(),
  },
} as KoaContextWithOIDC;

class ConfigLoaderMock {
  public getClients = () => clients;
  public getCookies = () => ({ cookie: "mycookie" });
  public getJwks = () => ({ keys: [{ key1: "key" }, { key2: "key" }] });
}

describe("configurationFactory", () => {
  test("It should return configuration object", async () => {
    expect.assertions(2);
    try {
      const config = await configurationFactory(new ConfigLoaderMock() as any);
      expect(config.clients).toEqual(clients);
      if (!config.interactions?.url) {
        throw new Error();
      }
      expect(config.interactions.url(context, {} as any)).toEqual(
        `/interaction/${context.oidc.uid}`
      );
    } catch (e) {
      throw e;
    }
  });
});

describe("getRounds", () => {
  test("It should return number", () => {
    expect(getRounds("3")).toBe(3);
    expect(getRounds(undefined)).toBe(5);
    expect(getRounds("some")).toBe(5);
  });
});
