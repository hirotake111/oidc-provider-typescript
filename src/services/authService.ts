import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

import { User } from "../models/User.model";
import { ROUNDS } from "../support/configuration";

export interface IcreateUserProps {
  username: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

interface IUserWithoutPassword {
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

export class AuthService {
  private userModel: typeof User;

  constructor(userModel: typeof User) {
    this.userModel = userModel;
  }

  // This create a new user and retruns the instance of it
  public async signUp(props: IcreateUserProps): Promise<User> {
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
      if (await this.userModel.findOne({ where: { username } })) {
        throw new Error("user already exists");
      }

      // create and return a new user
      const user = await this.userModel.create({
        ...props,
        id,
        password: await bcrypt.hash(password, ROUNDS),
        createdAt,
        updatedAt,
      });
      return {
        ...user,
      };
    } catch (e) {
      throw e;
    }
  }
}
