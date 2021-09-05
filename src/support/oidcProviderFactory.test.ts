import { GetOidcProvider } from "./oidcProviderFactory";
import { Provider } from "oidc-provider";
import { getConfig } from "../config";
import { env } from "../env";

describe("oidcProviderFactory", () => {
  test("It should return Provider instance", async () => {
    expect.assertions(1);
    try {
      const config = await getConfig(env);
      const p = GetOidcProvider(config, {} as any);
      expect(typeof p).toEqual("function");
    } catch (e) {
      throw e;
    }
  });
});
