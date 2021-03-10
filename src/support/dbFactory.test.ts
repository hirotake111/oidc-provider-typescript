import { dbFactory } from "./dbFactory";
import { ModelCtor, Sequelize } from "sequelize-typescript";
jest.mock("sequelize-typescript");

const connectionUri = "postgres://user:pass@example.com:5432";

describe("dbFactory", () => {
  test("It should return sequelize object", async () => {
    expect.assertions(1);
    // create mock
    const options = {};
    try {
      const db = await dbFactory(connectionUri, [] as ModelCtor[], options);
      expect(Sequelize).toHaveBeenCalledTimes(1);
    } catch (e) {
      throw e;
    }
  });
});
