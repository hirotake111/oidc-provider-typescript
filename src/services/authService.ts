import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import {
  KoaContextWithOIDC,
  Account,
  AccountClaims,
  ClaimsParameterMember,
} from "oidc-provider";

import { ICreateUserProps, User } from "../models/User.model";
import { ConfigType } from "../config";
import { isUUIDv4 } from "../utils/utils";

interface ISignUpReturnType {
  id: string;
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthService {
  signUp(props: ICreateUserProps): Promise<ISignUpReturnType>;
  authenticate: (username: string, password: string) => Promise<string | null>;
  findAccount(
    ctx: KoaContextWithOIDC,
    sub: string,
    token?: any
  ): Promise<Account | undefined>;
  // createUser(props: ICreateUserProps): Promise<string>;
}

export const getAuthService = (
  config: ConfigType,
  models: { User: typeof User }
): AuthService => {
  const { User: UserModel } = models;
  return {
    // creates a new user and retruns the instance of it
    async signUp(props: ICreateUserProps): Promise<ISignUpReturnType> {
      const { username, password } = props;
      try {
        const id = uuid();
        const createdAt = new Date();
        const updatedAt = createdAt;
        // check length of password
        if (password.length > 20 || password.length < 8) {
          throw new Error("password is too long or too short");
        }
        // if user already exists -> raise an error
        if (await UserModel.findOne({ where: { username } })) {
          throw new Error("user already exists");
        }

        // create and return a new user
        const user = await UserModel.create({
          ...props,
          id,
          password: await bcrypt.hash(password, config.ROUNDS),
          createdAt,
          updatedAt,
        });
        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      } catch (e) {
        throw e;
      }
    },

    // returns user ID if authenticated, otherwise null
    async authenticate(
      username: string,
      password: string
    ): Promise<string | null> {
      try {
        // fetch user from database
        const user = await UserModel.findOne({ where: { username } });
        if (!user) {
          return null;
        }
        const result = await bcrypt.compare(password, user.password);
        return result ? user.id : null;
      } catch (e) {
        throw e;
      }
    },

    // @param ctx - koa request context
    // @param sub {string} - account identifier (subject)
    // @param token - is a reference to the token used for which a given account is being loaded,
    //   is undefined in scenarios where claims are returned from authorization endpoint
    async findAccount(
      ctx: KoaContextWithOIDC,
      sub: string,
      token?: any
    ): Promise<Account | undefined> {
      try {
        // validate user ID
        if (!isUUIDv4(sub)) throw new Error("invalid user ID");
        // fetch user by id and return undefined if not mached
        const account = await UserModel.findOne({ where: { id: sub } });
        if (!account) return undefined;
        return {
          accountId: sub,
          // @param use {string} - can either be "id_token" or "userinfo", depending on
          //   where the specific claims are intended to be put in
          // @param scope {string} - the intended scope, while oidc-provider will mask
          //   claims depending on the scope automatically you might want to skip
          //   loading some claims from external resources or through db projection etc. based on this
          //   detail or not return them in ID Tokens but only UserInfo and so on
          // @param claims {object} - the part of the claims authorization parameter for either
          //   "id_token" or "userinfo" (depends on the "use" param)
          // @param rejected {Array[String]} - claim names that were rejected by the end-user, you might
          //   want to skip loading some claims from external resources or through db projection
          async claims(
            use: string,
            scope: string,
            claims: { [key: string]: null | ClaimsParameterMember },
            rejected: string[]
          ): Promise<AccountClaims> {
            // console.log("use: ", use);
            // console.log("scope: ", scope);
            // console.log("claims: ", claims);
            // console.log("rejected[]: ", rejected);
            return {
              sub,
              email: "noreply@example.com",
              email_verified: false,
              name: account.username,
              display_name: account.displayName,
              given_name: account.firstName,
              family_name: account.lastName,
              updated_at: account.updatedAt,
            };
          },
        };
      } catch (e) {
        throw e;
      }
    },
  };
};
