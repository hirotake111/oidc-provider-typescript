import { IsUUID } from "sequelize-typescript";
import { v4 as uuid } from "uuid";

import { isUUIDv4 } from "./utils";
describe("Test utils.ts", () => {
  test("isUUIDv4() should return true if given string is UUIDv4", () => {
    expect.assertions(1);
    expect(isUUIDv4(uuid())).toEqual(true);
  });
  test("isUUIDv4() should return false if given string is not UUIDv4", () => {
    expect.assertions(1);
    expect(isUUIDv4("abcdabcd-abcabc-abcabc-abcdabcd")).toEqual(false);
  });
  test("isUUIDv4() should return false if given string is undefined", () => {
    expect.assertions(1);
    expect(isUUIDv4(undefined)).toEqual(false);
  });
});
