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

let server: Server;
(async () => {
  const app = express();

  // get congig
  const config = await getConfig();

  // setting configuration
  useSetting(app);

  // connect to database
  const options: SequelizeOptions = config.PROD
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
  await dbFactory(config.DATABASE_URI, [User], options);

  // add test user
  if (!config.PROD) {
    console.log("Adding test user...");
    await addTestUser();
  }

  // get AuthService
  const AuthService = getAuthService(config);

  // get controller
  const controller = getController(config, AuthService);

  // Set the following setting if this app has web server in front of itself
  app.enable("trust proxy");

  // Append routes
  useRoute(app, controller, config);

  // start HTTP server
  server = app.listen(config.PORT, () => {
    console.log(`${config.ISSUER}/.well-known/openid-configuration`);
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
