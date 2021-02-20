import {
  FindAccount,
  Account as IAccount,
  KoaContextWithOIDC,
  ClaimsParameterMember,
  CanBePromise,
  AccountClaims,
} from "oidc-provider";

const store = new Map<string, Account>();
const logins = new Map<string, Account>();

import { nanoid } from "nanoid";

type IUse = "id_token" | "userinfo";

interface IProfile {
  email?: string;
  email_verified?: string;
  family_name?: string;
  given_name?: string;
  locale?: string;
  name?: string;
}

interface IClaim extends IProfile {
  sub: string;
}

type IClaims = (use: any, scope: any) => Promise<any>;

/**
 * Account class only has static methods
 * - findAccount (required)
 * - authenticate (optional)
 */
class Account {
  accountId: string;
  profile?: IProfile;

  constructor(id?: string, profile?: IProfile) {
    this.accountId = id || nanoid();
    this.profile = profile;
    store.set(this.accountId, this);
  }

  async claims(
    use: string,
    scope: string,
    claims: { [key: string]: null | ClaimsParameterMember }
  ): Promise<AccountClaims> {
    if (this.profile) {
      return {
        sub: this.accountId, // It is essential to always return a sub claim
        email: this.profile?.email,
        email_verified: this.profile?.email_verified,
        family_name: this.profile?.family_name,
        given_name: this.profile?.given_name,
        locale: this.profile?.locale,
        name: this.profile?.name,
      };
    }
    return {
      sub: this.accountId,
    };
  }

  static async authenticate(login: string) {
    let account = logins.get(login);
    // If ID does not exist, register it
    if (!account) {
      account = new Account(login);
      logins.set(login, account);
    }

    return account;
  }

  /**
   *
   * findAccount(id: string, token: string):
   * oidc-provider needs to be able to find an account and once found
   *  the account needs to have an accountId property as well as claims() function
   * returning an object with claims that correspond to the claims your issuer supports.
   * Tell oidc-provider how to find your account by an ID. #claims() can also
   * return a Promise later resolved / rejected.
   *
   * @param ctx KoaContextWithOIDC
   * @param sub string
   * @param token string
   * retrieve account from store and returns it
   */
  static findAccount(ctx: KoaContextWithOIDC, sub: string, token?: any) {
    // Fetch user by id
    const user = store.get(sub);
    if (!user) {
      // User doesnt exist
      return undefined;
    }

    return {
      accountId: sub,
      async claims(
        use: string,
        scope: string,
        claims: { [key: string]: null | ClaimsParameterMember }
      ): Promise<AccountClaims> {
        return {
          sub,
          email: user.profile?.email,
          email_verified: user.profile?.email_verified,
          family_name: user.profile?.family_name,
          given_name: user.profile?.given_name,
          locale: user.profile?.locale,
          name: user.profile?.name,
        };
      },
    };
  }
}

export default Account;
