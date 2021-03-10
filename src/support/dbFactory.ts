import {
  Model,
  ModelCtor,
  Sequelize,
  SequelizeOptions,
} from "sequelize-typescript";

export async function dbFactory(
  connectionUri: string,
  models: ModelCtor<Model<any, any>>[],
  options?: SequelizeOptions
): Promise<Sequelize> {
  try {
    // connect to database
    const sequelize = new Sequelize(connectionUri, {
      models,
      ...options,
    });
    // check connection
    await sequelize.authenticate();
    // create database if not exists
    await sequelize.sync();
    return sequelize;
  } catch (e) {
    throw e;
  }
}
