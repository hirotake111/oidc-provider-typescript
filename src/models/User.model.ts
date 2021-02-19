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

  public static createUser(props: IcreateUserProps): Promise<User> {
    return new Promise((resolve, reject) => {
      const id = uuid();
      const createdAt = new Date();
      const updatedAt = createdAt;
      if (props.password.length > 20) throw new Error("password is too long");
      // Generate password
      bcrypt
        .genSalt(5)
        .then((salt) => bcrypt.hash(props.password, salt))
        .then((hashed) =>
          this.create({ id, ...props, password: hashed, createdAt, updatedAt })
        )
        .then((user) => resolve(user));
    });
  }

  public static authenticate(
    username: string,
    password: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // fetch user from database
      User.findOne({ where: { username } })
        .then((user) => bcrypt.compare(password, user!.password))
        .then((result) => resolve(result))
        .catch((_) => resolve(false));
    });
  }
}

// export default User;
