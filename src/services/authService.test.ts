import { nanoid } from "nanoid";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";

import { AuthService, getAuthService } from "./authService";
import { ConfigType, getConfig } from "../config";
import { getRounds } from "../utils/utils";
import { env } from "../env";
import { ICreateUserProps } from "../models/User.model";

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
    let config: ConfigType;
    let authService: AuthService;
    let models: any;
    let user: {
      id: string;
      username: string;
      password: string;
      displayName: string;
      firstName: string;
      lastName: string;
    };

    beforeEach(async () => {
      user = createUser();
      models = {
        User: {
          findOne: jest.fn().mockReturnValue(null),
          create: jest.fn().mockReturnValue(user),
        },
      } as any;
    });

    test("It should create a new user", async () => {
      expect.assertions(5);
      try {
        config = await getConfig(env);
        authService = getAuthService(config, models);
        const created = await authService.signUp(user);
        expect(created.id).toEqual(user.id);
        expect(created.username).toEqual(user.username);
        expect(created.displayName).toEqual(user.displayName);
        expect(created.firstName).toEqual(user.firstName);
        expect(created.lastName).toEqual(user.lastName);
      } catch (e) {
        throw e;
      }
    });

    test("It should fail if password is too long or too short", async () => {
      expect.assertions(2);
      user = createUser(21);
      authService = getAuthService(config, models);
      try {
        await authService.signUp(user);
      } catch (e) {
        if (e instanceof Error)
          expect(e.message).toEqual("password is too long or too short");
      }
      try {
        user.password = nanoid(7);
        await authService.signUp(user);
      } catch (e) {
        if (e instanceof Error)
          expect(e.message).toEqual("password is too long or too short");
      }
    });

    test("It should fail user already exists", async () => {
      expect.assertions(1);
      user = createUser();
      models.User.findOne = jest.fn().mockReturnValue(user);
      authService = getAuthService(config, models);
      try {
        await authService.signUp(user);
      } catch (e) {
        if (e instanceof Error)
          expect(e.message).toEqual("user already exists");
      }
    });
  });

  describe(".authenticate() method", () => {
    let config: ConfigType;
    let authService: AuthService;
    const ROUNDS = 5;
    let models: {
      User: {
        findOne: () => any;
      };
    };

    beforeEach(async () => {
      config = await getConfig(env);
      models = {
        User: {
          findOne: jest.fn(),
        },
      };
    });

    test("It should return id", async () => {
      try {
        expect.assertions(1);
        const id = uuid();
        const username = "adele";
        const plain = nanoid();
        const password = await bcrypt.hash(plain, ROUNDS);
        const user = { id, username, password };
        models.User.findOne = jest.fn().mockReturnValue(user);
        authService = getAuthService(config, models as any);
        const result = await authService.authenticate(username, plain);
        expect(result).toEqual(user.id);
      } catch (e) {
        throw e;
      }
    });

    test("It should return null if credentials is invald", async () => {
      try {
        expect.assertions(2);
        const id = "xxx-xxx-xxx";
        const username = "adele";
        const plain = nanoid();
        const password = await bcrypt.hash("otherpassword", ROUNDS);
        const user = { id, username, password };
        models.User.findOne = jest.fn().mockReturnValueOnce(user);
        authService = getAuthService(config, models as any);
        expect(await authService.authenticate(username, plain)).toEqual(null);
        expect(await authService.authenticate("Megan", "xxxxxxxx")).toEqual(
          null
        );
      } catch (e) {
        throw e;
      }
    });

    test("It should throw error", async () => {
      const msg = "db error";
      try {
        expect.assertions(1);
        models.User.findOne = jest.fn().mockImplementation(() => {
          throw new Error(msg);
        });
        authService = getAuthService(config, models as any);
        await authService.authenticate("Adele", "adelespassword");
      } catch (e) {
        if (e instanceof Error) expect(e.message).toEqual(msg);
      }
    });
  });

  describe(".findAccount() method", () => {
    let config: ConfigType;
    let user: {
      id: string;
      username: string;
      displayName: string;
      firstName: string;
      lastName: string;
    };
    let ctx: any;
    let authService: AuthService;
    let models: {
      User: {
        findOne: any;
      };
    };

    beforeEach(async () => {
      config = await getConfig(env);
      user = createUser();
      models = {
        User: { findOne: jest.fn().mockReturnValue(user) },
      };
      ctx = {};
      authService = getAuthService(config, models as any);
    });

    test("It should return Promise<Account | undefined>", async () => {
      expect.assertions(3);
      try {
        const account = await authService.findAccount(ctx, user.id);
        if (!account) throw new Error("account is undefined");
        const { accountId, claims } = account;
        expect(accountId).toEqual(user.id);
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
        models.User.findOne = jest.fn().mockReturnValue(null);
        const account = await authService.findAccount(ctx, uuid());
        expect(account).toEqual(undefined);
      } catch (e) {
        throw e;
      }
    });

    it("should throw error if id is not UUID", async () => {
      expect.assertions(1);
      try {
        await authService.findAccount(ctx, "xxxx");
      } catch (e) {
        if (e instanceof Error) expect(e.message).toEqual("invalid user ID");
      }
    });

    it("should throw error if any other error", async () => {
      expect.assertions(1);
      const msg = "unknown error";
      try {
        models.User.findOne = jest.fn().mockImplementation(() => {
          throw new Error(msg);
        });
        await authService.findAccount(ctx, uuid());
      } catch (e) {
        if (e instanceof Error) expect(e.message).toEqual(msg);
      }
    });
  });
});
