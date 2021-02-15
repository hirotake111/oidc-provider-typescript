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
} from "sequelize-typescript";

@Table
export class User extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Column
  id!: string;

  @Unique
  @Column
  username!: string;

  @Column
  displayName?: string;

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
}

// export default User;
