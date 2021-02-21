import path from "path";
import url from "url";
import assert from "assert";

import express from "express";
import helmet from "helmet";
import set from "lodash/set";
import { Provider } from "oidc-provider";
import { Sequelize } from "sequelize-typescript";

import { configuration } from "./support/configuration";
import { Server } from "http";
import { useRoute } from "./router";
import { User } from "./models/User.model";
import { dbFactory } from "./support/dbFactory";

const DATABASE_URI = process.env.DATABASE_URI;
const ISSUER = process.env.ISSUER;
assert(typeof DATABASE_URI === "string", "Connection string for DB is empty");
assert(typeof ISSUER === "string", "You need to set ISSUER env vairable");

const PORT = process.env.PORT || 3000; // Port number
const isProduction = process.env.NODE_ENV === "production";

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
  // // // connect to database
  // const sequelize = new Sequelize(DATABASE_URI, {
  //   models: [User],
  //   logging: false,
  // });
  // await sequelize.authenticate();
  // // create databaase if not exists
  // await sequelize.sync();

  // connect to database
  const sequelize = await dbFactory(DATABASE_URI, [User], { logging: false });

  // add test user
  if (!isProduction) {
    await User.destroy({ where: { username: "test" } });
    await User.createUser({
      username: "test",
      password: "test",
      displayName: "test",
    });
  }

  if (isProduction) {
    set(configuration, "cookies.short.secure", true);
    set(configuration, "cookies.long.secure", true);
  }

  // Create a new provider
  const provider = new Provider(ISSUER, {
    adapter: undefined, // use default in-memory adapter
    ...configuration,
    findAccount: User.findAccount,
  });

  if (isProduction) {
    // Set the following setting if this app has web server in front of itself
    app.enable("trust proxy");
    provider.proxy = true;

    app.use((req, res, next) => {
      // Below is a shorthand for req.protocol === 'https'
      // meaning if it's http, redirect to https
      if (req.secure) {
        next();
      } else if (req.method === "GET" || req.method === "HEAD") {
        res.redirect(
          url.format({
            protocol: "https",
            host: req.get("host"),
            pathname: req.originalUrl,
          })
        );
      } else {
        res.status(400).json({
          error: "invalid_request",
          error_description: "do yourself a favor and only use https",
        });
      }
    });
  }

  // Append routes for /interaction
  useRoute(app, provider);
  // 404 for the rest of the requests
  app.use(provider.callback);

  server = app.listen(PORT, () => {
    console.log(`CHECK OUT ${ISSUER}/.well-known/openid-configuration`);
    if (!isProduction) console.log("http://localhost:3001");
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});

// app.get("/", (req, res) => res.json({ msg: "express + typescript" }));

// app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
