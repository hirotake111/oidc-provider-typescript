import { nanoid } from "nanoid";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";

import { AuthService, getAuthService } from "./authService";
import { ICreateUserProps, User } from "../models/User.model";
import { ConfigType, getRounds } from "../config";
import { KoaContextWithOIDC } from "oidc-provider";

const createUser = (len: number = 10) => ({
  id: uuid(),
  username: "adele",
  password: nanoid(len),
  displayName: "Adele Vance",
  firstName: "Adele",
  lastName: "Vance",
});

describe("AuthService", () => {
  describe("signUp() method", () => {
    let config: any;
    let authService: AuthService;
    beforeEach(() => {
      config = { ROUNDS: 4 };
      authService = getAuthService(config);
    });
    test("It should create a new user", async () => {
      expect.assertions(5);
      try {
        const user = createUser();
        User.findOne = jest.fn().mockReturnValueOnce(null);
        User.create = jest.fn().mockReturnValue(user);
        const created = await authService.signUp(user);
        expect(created.id).toEqual(user.id);
        expect(created.username).toEqual(user.username);
        expect(created.displayName).toEqual(user.displayName);
        expect(created.firstName).toEqual(user.firstName);
        expect(created.lastName).toEqual(user.lastName);
      } catch (e) {
        console.error(e);
      }
    });

    test("It should fail if password is too long or too short", async () => {
      expect.assertions(2);
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

    test("It should fail user already exists", async () => {
      expect.assertions(1);
      const user = createUser();
      User.findOne = jest.fn().mockReturnValueOnce(user);
      try {
        await authService.signUp(user);
      } catch (e) {
        expect(e.message).toEqual("user already exists");
      }
    });
  });

  describe(".authenticate() method", () => {
    let config: any;
    let authService: AuthService;
    const ROUNDS = getRounds("5");
    beforeEach(() => {
      config = { ROUDNS: 4 };
      authService = getAuthService(config);
    });

    test("It should return id", async () => {
      try {
        expect.assertions(1);
        const username = "adele";
        const plainPassword = nanoid();
        const user = {
          id: uuid(),
          username,
          password: await bcrypt.hash(plainPassword, ROUNDS),
        };
        User.findOne = jest.fn().mockReturnValueOnce(user);
        const isAuthenticated = await authService.authenticate(
          user.username,
          plainPassword
        );
        expect(isAuthenticated).toEqual(user.id);
      } catch (e) {
        throw e;
      }
    });

    test("It should return null if credentials is invald", async () => {
      try {
        expect.assertions(2);
        const username = "adele";
        const plainPassword = nanoid();
        const user = {
          id: "xxx-xxx-xxx",
          username,
          password: await bcrypt.hash("otherpassword", ROUNDS),
        };
        User.findOne = jest.fn().mockReturnValueOnce(user);
        expect(await authService.authenticate(username, plainPassword)).toEqual(
          null
        );
        expect(await authService.authenticate("Megan", "mypassword")).toEqual(
          null
        );
      } catch (e) {
        throw e;
      }
    });

    test("It should throw error", async () => {
      try {
        expect.assertions(1);
        User.findOne = jest.fn().mockRejectedValue(new Error("Database Error"));
        await authService.authenticate("Adele", "adelespassword");
      } catch (e) {
        expect(e.message).toEqual("Database Error");
      }
    });
  });

  describe(".findAccount() method", () => {
    let config: any;
    let authService: AuthService;
    beforeEach(() => {
      config = { ROUNDS: 4 };
      authService = getAuthService(config);
    });

    test("It should return Promise<Account | undefined>", async () => {
      expect.assertions(3);
      try {
        const user = createUser();
        User.findOne = jest.fn().mockReturnValue(user);
        const account = await authService.findAccount(
          {} as KoaContextWithOIDC,
          user.id
        );
        expect(account?.accountId).toEqual(user.id);
        const claims = account?.claims;
        if (!claims) {
          throw new Error("claims() is not defined");
        }
        expect(typeof claims).toEqual("function");
        const claimsResult = await claims("use", "scope", {} as any, []);
        expect(claimsResult.sub).toEqual(user.id);
      } catch (e) {
        throw e;
      }
    });

    test("It should return undefined if not exists", async () => {
      expect.assertions(1);
      try {
        User.findOne = jest.fn().mockReturnValue(null);
        const account = await authService.findAccount(
          {} as KoaContextWithOIDC,
          uuid()
        );
        expect(account).toEqual(undefined);
      } catch (e) {
        throw e;
      }
    });

    test("It hould throw error if id is not UUID", async () => {
      expect.assertions(1);
      try {
        const user = createUser();
        user.id = "userId";
        User.findOne = jest.fn().mockReturnValue(user);
        const account = await authService.findAccount(
          {} as KoaContextWithOIDC,
          user.id
        );
      } catch (e) {
        expect(e.message).toEqual("invalid user ID");
      }
    });

    test("It hould throw error if any other error", async () => {
      expect.assertions(1);
      try {
        User.findOne = jest.fn().mockRejectedValue(new Error("Database Error"));
        await authService.findAccount({} as KoaContextWithOIDC, uuid());
      } catch (e) {
        expect(e.message).toEqual("Database Error");
      }
    });
  });

  describe("createuser() method", () => {
    let props: ICreateUserProps;
    let config: ConfigType;

    beforeEach(() => {
      props = {
        username: nanoid(),
        password: nanoid(),
        displayName: nanoid(),
      };
      config = { ROUNDS: 5 } as any;
    });

    it("should create user", async () => {
      expect.assertions(1);
      try {
        const auth = getAuthService(config);
        expect(typeof (await auth.createUser(props))).toEqual("string");
      } catch (e) {
        throw e;
      }
    });
  });
});
