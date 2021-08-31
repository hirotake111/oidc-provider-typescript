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

export interface ICreateUserProps {
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
}
