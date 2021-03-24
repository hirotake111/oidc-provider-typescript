import { Server } from "http";

import express from "express";

import { configurationFactory } from "./support/configuration";
import { DATABASE_URI, ISSUER, PORT, PROD } from "./config";
import { useRoute } from "./router";
import { User } from "./models/User.model";
import { dbFactory } from "./support/dbFactory";
import { addTestUser, useSetting } from "./support/utils";
import { UserController } from "./controllers/User.controller";
import { oidcProviderFactory } from "./support/oidcProviderFactory";
import { AuthService } from "./services/authService";
import { ConfigLoaderEnv } from "./support/configLoaderEnv";
import { RedisAdapter } from "./adapters/redisAdapter";
import { SequelizeOptions } from "sequelize-typescript";

let server: Server;
(async () => {
  const app = express();

  // setting configuration
  useSetting(app);

  // connect to database
  const options: SequelizeOptions = PROD
    ? {
        logging: false,
        dialectOptions: {
          ssl: {
            requre: true,
            rejectUnauthorized: false,
          },
        },
      }
    : { logging: false };
  await dbFactory(DATABASE_URI, [User], options);

  // add test user
  if (!PROD) {
    console.log("Adding test user...");
    await addTestUser();
  }

  // generate configuration
  const configuration = await configurationFactory(new ConfigLoaderEnv());

  // get OIDC provider
  const provider = oidcProviderFactory(
    ISSUER,
    configuration,
    // undefined,
    RedisAdapter,
    AuthService.findAccount
  );

  // get user controller
  const userController = new UserController(provider, AuthService.authenticate);

  if (PROD) {
    // Set the following setting if this app has web server in front of itself
    app.enable("trust proxy");
    provider.proxy = true;
  }

  // Append routes
  useRoute(app, userController);

  // start HTTP server
  server = app.listen(PORT, () => {
    console.log(`${ISSUER}/.well-known/openid-configuration`);
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
