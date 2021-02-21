import { Express, NextFunction, Request, Response } from "express";
import { urlencoded } from "express";
import { InteractionResults, Provider } from "oidc-provider";
import { User } from "./models/User.model";

async function notFound(req: Request, res: Response) {
  res.status(404).send("NOT FOUND.");
}

function setNoCache(req: Request, res: Response, next: NextFunction) {
  res.set("Pragma", "no-cache");
  res.set("Cache-Control", "no-cache, no-store");
  next();
}

const parse = urlencoded({ extended: false });

export function useRoute(app: Express, provider: Provider): void {
  app.get("/interaction/:uid", async (req, res, next) => {
    // Set no-cache
    res.set("Pragma", "no-cache");
    res.set("Cache-Control", "no-cache, no-store");

    try {
      const details = await provider.interactionDetails(req, res);
      const { prompt, params, uid, session } = details;

      const client = await provider.Client.find(params.client_id);

      switch (prompt.name) {
        case "login": {
          return res.render("login", {
            client,
            uid,
            params,
            details: prompt.details,
            title: "Sign-in",
            session: session ? session : undefined,
            dbg: { params, prompt },
            flash: undefined,
          });
        }

        case "consent": {
          // consent prompt
          console.log("prompt.name is consent!!!!!");
          return res.render("interaction", {
            client,
            uid,
            details: prompt.details,
            params,
            title: "Authorize",
            session: session ? session : undefined,
            dbg: { params, prompt },
            flash: undefined,
          });
        }

        default:
          notFound(req, res);
          return;
      }
    } catch (err) {
      console.log("error!!!");
      return next(err);
    }
  });

  app.post("/interaction/:uid/login", async (req, res, next) => {
    // redirect to client/callback
    try {
      const details = await provider.interactionDetails(req, res);
      // console.log("details: ", details);
      const { prompt, params, uid, session } = details;
      const client = await provider.Client.find(params.client_id);
      const { username, password } = req.body;

      //
      if (
        !username ||
        !password ||
        typeof username !== "string" ||
        typeof password !== "string"
      ) {
        params.login_hint = username;
        // invalid usrname or password -> back to login page
        res.render("login", {
          client,
          uid,
          params,
          details: prompt.details,
          title: "Sign-in",
          session: session ? session : undefined,
          dbg: { params, prompt },
          flash: "invalid username or password",
        });
        return;
      }
      const accountId = await User.authenticate(username, password);
      console.log("accountId: ", accountId);
      if (accountId) {
        // successfully signed in -> finish interaction
        const result: InteractionResults = { login: { account: accountId } };
        await provider.interactionFinished(req, res, result, {
          mergeWithLastSubmission: false,
        });
        return;
      }
      // invalid usrname or password -> back to login page
      params.login_hint = username;
      res.render("login", {
        client,
        uid,
        params,
        details: prompt.details,
        title: "Sign-in",
        session: session ? session : undefined,
        dbg: { params, prompt },
        flash: "invalid username or password",
      });
      return;
    } catch (error) {
      notFound(req, res);
      return;
    }
  });

  app.get("/interaction/:uid/abort", async (req, res) => {
    try {
      // redirect to client/callback
      const { params } = await provider.interactionDetails(req, res);
      const redirectUri = params?.redirect_uri;
      if (redirectUri) {
        res.redirect(params.redirect_uri);
        return;
      }

      notFound(req, res);
      return;
    } catch (e) {
      notFound(req, res);
      return;
    }
  });

  app.post("/interaction/:uid/confirm", setNoCache, parse, async (req, res) => {
    try {
      const result = {
        consent: {
          // rejectedScopes: [], // < uncomment and add rejections here
          // rejectedClaims: [], // < uncomment and add rejections here
        },
      };
      await provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: true,
      });
    } catch (err) {
      notFound(req, res);
    }
  });

  // app.use((req, res) => res.status(404).send("NOT FOUND."));
}
