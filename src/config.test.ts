import { getConfig } from "./config";

describe("getConfig()", () => {
  it("should return config without any environment variables", async () => {
    expect.assertions(1);
    try {
      const config = getConfig();
      expect((await config).DATABASE_URI).toEqual("NODATABASECONNECTIONSTRING");
    } catch (e) {
      throw e;
    }
  });
});
