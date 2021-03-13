import { oidcProviderFactory } from "./oidcProviderFactory";
import { Provider } from "oidc-provider";

jest.mock("oidc-provider");

describe("oidcProviderFactory", () => {
  test("It should return Provider instance", () => {
    expect.assertions(1);
    try {
      const p = oidcProviderFactory("issuer", {} as any, {} as any, {} as any);
      expect(Provider).toBeCalledTimes(1);
    } catch (e) {
      throw e;
    }
  });
});
