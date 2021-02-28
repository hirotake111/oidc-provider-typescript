import path from "path";

import express from "express";
import helmet from "helmet";
import set from "lodash/set";
import { Provider } from "oidc-provider";

import {
  configuration,
  DATABASE_URI,
  ISSUER,
  PORT,
  PROD,
} from "./support/configuration";
import { Server } from "http";
import { useRoute } from "./router";
import { User } from "./models/User.model";
import { AuthService } from "./services/authService";
import { redirectToHTTPS } from "./controllers/User.controller";
import { dbFactory } from "./support/dbFactory";

const app = express();

// Proxy setting
// Set the following if this app has web server in front of itself
app.set("trust proxy", true);
// Use body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// helmet
app.use(helmet());
// View settings
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

let server: Server;
(async () => {
  // connect to database
  await dbFactory(DATABASE_URI, [User], { logging: true });

  // add test user
  if (!PROD) {
    await User.destroy({ where: { username: "test" }, force: true });
    await User.create({
      id: "83440b66-11a4-497f-83c4-beaf1eaef9c2",
      username: "test",
      password: "$2b$05$nJTc3d1Y1RnUSiboeNEyau2dAlNGACy/ryghOcq4rwLa/pA4eVj6i",
      displayName: "Test User",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(await User.findAll());
  }

  if (PROD) {
    set(configuration, "cookies.short.secure", true);
    set(configuration, "cookies.long.secure", true);
  }

  // Create a new provider
  const provider = new Provider(ISSUER, {
    adapter: undefined, // use default in-memory adapter
    ...configuration,
    findAccount: AuthService.findAccount,
  });

  if (PROD) {
    // Set the following setting if this app has web server in front of itself
    app.enable("trust proxy");
    provider.proxy = true;

    // if HTTP redirect to HTTPS
    app.use(redirectToHTTPS);
  }

  // Append routes for /interaction
  useRoute(app, provider);
  // 404 for the rest of the requests
  app.use(provider.callback);

  server = app.listen(PORT, () => {
    console.log(`CHECK OUT ${ISSUER}/.well-known/openid-configuration`);
    if (!PROD) console.log("http://localhost:3001");
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});

// app.get("/", (req, res) => res.json({ msg: "express + typescript" }));

// app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
