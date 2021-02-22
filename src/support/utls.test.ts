import { IsUUID } from "sequelize-typescript";
import { v4 as uuid } from "uuid";

import { isUUIDv4 } from "./util";
describe("Test utils.ts", () => {
  test("isUUIDv4() should return true if given string is UUIDv4", () => {
    expect.assertions(1);
    expect(isUUIDv4(uuid())).toBe(true);
  });
  test("isUUIDv4() should return false if given string is not UUIDv4", () => {
    expect.assertions(1);
    expect(isUUIDv4("abcdabcd-abcabc-abcabc-abcdabcd")).toBe(false);
  });
  test("isUUIDv4() should return false if given string is undefined", () => {
    expect.assertions(1);
    expect(isUUIDv4(undefined)).toBe(false);
  });
});
