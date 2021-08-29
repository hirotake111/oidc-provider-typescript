import { v4 as uuid } from "uuid";
import { User } from "../models/User.model";
import { addTestUser, isUUIDv4, useSetting } from "./utils";

jest.mock("../models/User.model");

describe("Test utils.ts", () => {
  describe("isUUIDv4()", () => {
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

  describe("useSetting()", () => {
    describe("addTestuser", () => {
      it("should add test user to db", async () => {
        expect.assertions(2);
        try {
          await addTestUser();
          expect(User.create).toHaveBeenCalledTimes(1);
          expect(User.destroy).toHaveBeenCalledTimes(1);
        } catch (e) {
          throw e;
        }
      });
    });
  });
});
