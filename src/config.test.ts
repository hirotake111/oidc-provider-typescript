import { getConfig } from "./config";
import { env } from "./env";

describe("getConfig()", () => {
  it("should return config without any environment variables", async () => {
    expect.assertions(1);
    try {
      const config = getConfig(env);
      expect((await config).DATABASE_URI).toEqual("NODATABASECONNECTIONSTRING");
    } catch (e) {
      throw e;
    }
  });
});
