import { Server } from "http";

import express from "express";

import {
  DATABASE_URI,
  ISSUER,
  PORT,
  PROD,
  configurationFactory,
} from "./support/configuration";
import { useRoute } from "./router";
import { User } from "./models/User.model";
import { dbFactory } from "./support/dbFactory";
import { addTestUser, useSetting } from "./support/utils";
import { UserController } from "./controllers/User.controller";
import { oidcProviderFactory } from "./support/oidcProviderFactory";
import { AuthService } from "./services/authService";
import { clientFactory } from "./support/configLoader";

let server: Server;
(async () => {
  const app = express();

  // setting configuration
  useSetting(app);

  // connect to database
  await dbFactory(DATABASE_URI, [User], { logging: false });

  // add test user
  if (!PROD) {
    await addTestUser();
  }

  // get OIDC provider
  const provider = oidcProviderFactory(
    ISSUER,
    await configurationFactory(clientFactory),
    undefined,
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
    console.log("http://localhost:3001");
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
