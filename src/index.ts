import { Server } from "http";
import express from "express";

import { DATABASE_URI, ISSUER, PORT, PROD } from "./support/configuration";
import { useRoute } from "./router";
import { User } from "./models/User.model";
import { dbFactory } from "./support/dbFactory";
import { addTestUser, useSetting } from "./support/utils";

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

  // Append routes for /interaction
  useRoute(app);

  // start HTTP server
  server = app.listen(PORT, () =>
    console.log(`${ISSUER}/.well-known/openid-configuration`)
  );
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
