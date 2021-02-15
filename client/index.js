/** OIDC Client for Testing */
const path = require("path");

const express = require("express");
const { Issuer, generators } = require("openid-client");

const ISSUER = "http://localhost:3000";
const PORT = 3001;
const URL = `http://localhost:${PORT}`;
const app = express();
const code_verifier = generators.codeVerifier();
const store = new Map();
const code_challenge = generators.codeChallenge(code_verifier);

// Midlewares
app.use(express.json()); // body-parser

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
      redirect_uris: ["http://localhost:3001/callback"],
      response_types: ["code"],
      // id_token_signed_response_alg (default "RS256")
      // token_endpoint_auth_method (default "client_secret_basic")
    });

    const authz_uri = client.authorizationUrl({
      scope: "openid email profile",
      code_challenge,
      code_challenge_method: "S256",
    });
    // console.log(`Authorizatio URI: ${authz_uri}`);

    app.get("/", (req, res) => res.render("index", { authz_uri }));

    app.get("/callback", (req, res) => {
      const { error, error_description } = req.query;
      res.json({
        location: "callback",
        error,
        error_description,
        status_code: res.statusCode,
      });
    });

    app.listen(PORT, () => console.log(`Check out ${URL}`));
  } catch (e) {
    console.log(e);
  }
})();
