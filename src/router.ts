import { strict } from "assert";
import querystring from "querystring";
import { inspect } from "util";

import {
  Express,
  NextFunction,
  RequestHandler,
  urlencoded,
  Response,
  Router,
} from "express";
import { Provider, errors, ClaimsWithRejects } from "oidc-provider";
// import isEmpty from "lodash/isEmpty";

// import Account from "./support/account";

const tmp = { opts: { acceptDPoP: true, acceptQueryParam: true } };
const {
  opts: { acceptDPoP, acceptQueryParam },
} = tmp;
acceptDPoP === true;

const body = urlencoded({ extended: false });
const { SessionNotFound } = errors;
const keys = new Set();

export function useRoute(app: Express, provider: Provider): void {
  // router.use((req, res, next) => {
  //   const orig = res.render;
  //   // you'll probably want to use a full blown render engine capable of layouts
  //   res.render = (view: string, locals: object | undefined) => {
  //     app.render(view, locals, (err, html) => {
  //       if (err) throw err;
  //       orig(view, { ...locals, body: html });
  //     });
  //   };
  //   next();
  // });

  app.get("/interaction/:uid", async (req, res, next) => {
    // Set no-cache
    res.set("Pragma", "no-cache");
    res.set("Cache-Control", "no-cache, no-store");

    try {
      const {
        uid,
        prompt,
        params,
        session,
      } = await provider.interactionDetails(req, res);
      const details = await provider.interactionDetails(req, res);
      const client = await provider.Client.find(params.client_id);

      switch (prompt.name) {
        case "login": {
          // login prompt
          return res.render("login", {
            client,
            uid,
            details: prompt.details,
            params,
            title: "Sign-in",
            session: session ? session : undefined,
            dbg: { params, prompt },
          });
        }

        case "consent": {
          // consent prompt
          return res.render("interaction", {
            client,
            uid,
            details: prompt.details,
            params,
            title: "Authorize",
            session: session ? session : undefined,
            dbg: { params, prompt },
          });
        }
        default:
          return undefined;
      }
    } catch (err) {
      return next(err);
    }
  });
}
