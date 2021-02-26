/** OIDC Client for Testing */
const path = require("path");
const assert = require("assert");

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { Issuer, generators } = require("openid-client");

assert(process.env.ISSUER, "==== ISSUER is empty ====");
assert(process.env.PORT, "==== PORT is empty ====");
assert(process.env.HOSTNAME, "==== HOSTNAME is empty ====");
assert(process.env.SECRETKEY, "==== SECRETKEY is empty ====");
const ISSUER = process.env.ISSUER;
const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;
const SECRETKEY = process.env.SECRETKEY;

const URL = `http://${HOSTNAME}:${PORT}`;
const app = express();
const store = new Map();

// Middlewares
app.use(express.json()); // body-parser
app.use(
  session({
    secret: SECRETKEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 2, // 2 minutes
      sameSite: "lax",
    },
  })
);

// View settings
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

(async () => {
  try {
    const issuer = await Issuer.discover(ISSUER);
    // console.log(`Discovered issuer: ${issuer.issuer} ${issuer.metadata}`);

    const client = new issuer.Client({
      client_id: "myclient",
      client_secret: "secret",
      redirect_uris: [`${URL}/callback`],
      response_types: ["code"],
      // id_token_signed_response_alg (default "RS256")
      // token_endpoint_auth_method (default "client_secret_basic")
    });

    // Landing page
    app.get("/", (req, res) => {
      if (req.session.userId && req.session.username) {
        // already signed in
        res.render("index", {
          message: `Signed in as ${req.session.username}`,
        });
        return;
      }
      /**
       * not signed in -> redirect to login page
       */
      // generate and store code verifier
      const codeVerifier = generators.codeVerifier();
      req.session.verifier = codeVerifier;
      // generate athorization URI
      let authz_uri = client.authorizationUrl({
        scope: "openid email profile",
        code_challenge: generators.codeChallenge(codeVerifier),
        code_challenge_method: "S256",
      });
      return res.redirect(authz_uri);
    });

    // callback endpoint
    app.get("/callback", (req, res) => {
      const { error, error_description } = req.query;
      const params = client.callbackParams(req);
      const code_verifier = req.session.verifier;
      console.log(params);
      client
        .callback(`${URL}/callback`, params, { code_verifier })
        .then((tokenSet) => {
          console.log("received and validated tokens %j", tokenSet);
          console.log("validated ID Token claims %j", tokenSet.claims());
          return res.send(tokenSet);
        })
        .catch((reason) => {
          console.error(reason);
          return res.status(500).send("INTERNAL SERVER ERROR");
        });

      // res.json({
      //   location: "callback",
      //   error,
      //   error_description,
      //   status_code: res.statusCode,
      // });
    });

    app.listen(PORT, () => console.log(`Check out ${URL}`));
  } catch (e) {
    console.log(e);
  }
})();
