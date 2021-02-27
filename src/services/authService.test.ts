import { nanoid } from "nanoid";
import { AuthService, IcreateUserProps } from "./authService";
import { User } from "../models/User.model";

const createUser = (len: number = 10) => ({
  username: "adele",
  password: nanoid(len),
  displayName: "Adele Vance",
  firstName: "Adele",
  lastName: "Vance",
});

describe("AuthService", () => {
  test(".signUp() method should create a new user", async () => {
    expect.assertions(4);
    try {
      const authService = new AuthService(User);
      const user = createUser();
      User.findOne = jest.fn().mockReturnValueOnce(null);
      User.create = jest.fn().mockReturnValue(user);
      const created = await authService.signUp(user);
      expect(created.username).toEqual(user.username);
      expect(created.displayName).toEqual(user.displayName);
      expect(created.firstName).toEqual(user.firstName);
      expect(created.lastName).toEqual(user.lastName);
    } catch (e) {
      console.error(e);
    }
  });

  test(".signUp() method should fail if password is too long or too short", async () => {
    expect.assertions(2);
    const authService = new AuthService(User);
    const user = createUser(21);
    User.findOne = jest.fn().mockReturnValueOnce(null);
    try {
      await authService.signUp(user);
    } catch (e) {
      expect(e.message).toEqual("password is too long or too short");
    }
    try {
      user.password = nanoid(7);
      await authService.signUp(user);
    } catch (e) {
      expect(e.message).toEqual("password is too long or too short");
    }
  });

  test(".signUp() method should fail user already exists", async () => {
    expect.assertions(1);
    const authService = new AuthService(User);
    const user = createUser();
    User.findOne = jest.fn().mockReturnValueOnce(user);
    try {
      await authService.signUp(user);
    } catch (e) {
      expect(e.message).toEqual("user already exists");
    }
  });
});
