import { dbFactory } from "./dbFactory";

const msg = "DATABASE ERROR";

jest.mock("sequelize-typescript", () => {
  return {
    Sequelize: jest.fn().mockImplementation(() => {
      return {
        authenticate: () => {
          throw new Error(msg);
        },
        sync: () => {
          return;
        },
      };
    }),
  };
});

describe("dbFactory", () => {
  test("It should throw an error", async () => {
    expect.assertions(1);
    const connectionUri = "postgres://user:pass@example.com:5432";
    try {
      await dbFactory(connectionUri, []);
    } catch (e) {
      if (e instanceof Error) expect(e.message).toEqual(msg);
    }
  });
});
