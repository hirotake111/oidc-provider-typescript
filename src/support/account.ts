import { FindAccount } from "oidc-provider";

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

class Account {
  accountId: string;
  profile?: IProfile;

  constructor(id: string, profile?: IProfile) {
    this.accountId = id || nanoid();
    this.profile = profile;
    store.set(this.accountId, this);
  }

  async claims(use: IUse, scope: string[]): Promise<IClaim> {
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

  static async findByFederated(
    provider: string,
    claims: IClaim
  ): Promise<Account> {
    const id = `${provider}.${claims.sub}`;
    let account = logins.get(id);
    // If ID does not exist, register it
    if (!account) {
      account = new Account(id, claims);
      logins.set(id, account);
    }
    return account;
  }

  static async findByLogin(login: string): Promise<Account> {
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
   * @param id string
   * @param token string
   * retrieve account from store and returns it
   */
  static async findAccount(id: string, token: string): Promise<Account> {
    let account = store.get(id);
    if (!account) {
      account = new Account(id);
      store.set(id, account);
    }
    return account;
  }
}

export default Account;
