import { Server } from "http";

import express from "express";

import { getConfig } from "./config";
import { useRoute } from "./router";
import { User } from "./models/User.model";
import { dbFactory } from "./support/dbFactory";
import { addTestUser, useSetting } from "./utils/utils";
import { getAuthService } from "./services/authService";
import { SequelizeOptions } from "sequelize-typescript";
import { getController } from "./controllers/controllers";
import { env } from "./env";
import { getIORedisClient, getRedisClient } from "./support/getRedisClient";
import { getRedisAdapter } from "./adapters/redisAdapter";
import { GetOidcProvider } from "./support/oidcProviderFactory";

let server: Server;
(async () => {
  const app = express();

  // get congig
  const config = await getConfig(env);

  // setting configuration
  useSetting(app);

  // connect to database
  const options: SequelizeOptions = {
    logging: false,
    dialectOptions: config.POSTGRES_CONNECTION_TLS
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  };
  await dbFactory(config.DATABASE_URI, [User], options);

  // add test user
  if (!config.PROD) {
    console.log("Bootstrapping server as DEVELOPMENT");
    console.log("Adding test user...");
    await addTestUser();
  } else {
    console.log("Bootstrapping server as PRODUCTION");
  }

  // get AuthService
  const AuthService = getAuthService(config, { User });

  // get redis client
  config.redisClient = getRedisClient(config.REDIS_URL);
  // get IORedis client
  const ioRedisClient = getIORedisClient(config.REDIS_URL, "iodc:");
  // get Redis Adapter
  const redisAdapter = getRedisAdapter(ioRedisClient);
  config.getProvider = GetOidcProvider(config, redisAdapter);
  // Set the following setting if this app has web server in front of itself
  app.enable("trust proxy");

  // get controller
  const controller = getController(config, AuthService);

  // Append routes
  useRoute(app, controller, config);

  // some logging messages
  console.log("USER_CREATION_ALLOWED:", config.USER_CREATION_ALLOWED);
  console.log("Connection to Redis over TLS:", config.REDIS_CONNECTION_TLS);
  if (!config.redisClient)
    console.log("config.redisClient is undefined - use in-memory store");

  // start HTTP server
  server = app.listen(config.PORT, () => {
    console.log(`${config.ISSUER}/.well-known/openid-configuration`);
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
