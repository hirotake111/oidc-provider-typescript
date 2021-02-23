import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import {
  Table,
  Model,
  Column,
  PrimaryKey,
  IsUUID,
  Unique,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  NotNull,
} from "sequelize-typescript";
import {
  KoaContextWithOIDC,
  Account,
  ClaimsParameterMember,
} from "oidc-provider";

export interface IcreateUserProps {
  username: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

@Table
export class User extends Model {
  @IsUUID(4)
  @NotNull
  @PrimaryKey
  @Column({ allowNull: false })
  id!: string;

  @NotNull
  @Unique
  @Column({ allowNull: false })
  username!: string;

  @NotNull
  @Column({ allowNull: false })
  password!: string;

  @NotNull
  @Column({ allowNull: false })
  displayName!: string;

  @Column
  firstName?: string;

  @Column
  lastName?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @DeletedAt
  deletedAt?: Date;

  public static async createUser(props: IcreateUserProps): Promise<User> {
    try {
      const id = uuid();
      const createdAt = new Date();
      const updatedAt = createdAt;
      // if password is too long - raise an error
      if (props.password.length > 20) {
        throw new Error("password is too long");
      }

      // if user already exists - raise an error
      if (await User.findOne({ where: { username: props.username } })) {
        throw new Error("user already exists");
      }

      const password = await bcrypt.hash(props.password, 5);
      const newUser = await User.create({
        ...props,
        id,
        password,
        createdAt,
        updatedAt,
      });
      return newUser;
    } catch (e) {
      throw e;
    }
  }

  public static async authenticate(
    username: string,
    password: string
  ): Promise<string | null> {
    try {
      // fetch user from database
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return null;
      }
      return (await bcrypt.compare(password, user.password)) ? user.id : null;
    } catch (e) {
      throw e;
    }
  }

  // @param ctx - koa request context
  // @param sub {string} - account identifier (subject)
  // @param token - is a reference to the token used for which a given account is being loaded,
  //   is undefined in scenarios where claims are returned from authorization endpoint
  public static async findAccount(
    ctx: KoaContextWithOIDC,
    sub: string,
    token?: any
  ): Promise<Account | undefined> {
    // console.log(".findAccount()");
    // console.log("ctx: ", ctx);

    // fetch user by id and return undefined if not mached
    const account = await User.findOne({ where: { id: sub } });
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
      ) {
        console.log("use: ", use);
        console.log("scope: ", scope);
        console.log("claims: ", claims);
        console.log("rejected[]: ", rejected);
        return {
          sub,
          email: "noreply@example.com",
          email_verified: "noreply@example.com",
        };
      },
    };
  }
}

// export default User;
