import { Express, Request, Response } from "express";
import { Provider } from "oidc-provider";
import { User } from "./models/User.model";

async function notFound(req: Request, res: Response) {
  res.status(404).send("NOT FOUND.");
}

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
          return notFound(req, res);
      }
    } catch (err) {
      console.log("error!!!");
      return next(err);
    }
  });

  app.post("/interaction/:uid/login", async (req, res) => {
    // redirect to client/callback
    try {
      const details = await provider.interactionDetails(req, res);
      const { prompt, params, uid, session } = details;
      const client = await provider.Client.find(params.client_id);
      console.log("details: ", details);
      if (await User.authenticate(req.body.username, req.body.password)) {
        return res.send("authenticated");
      }
      // invalid usrname or password -> back to login page
      return res.render("login", {
        client,
        uid,
        params,
        details: prompt.details,
        title: "Sign-in",
        session: session ? session : undefined,
        dbg: { params, prompt },
        flash: "invalid username or password",
      });
      // res.send("login page");
    } catch (error) {
      return res.render("index", {
        flash: error,
      });
    }
  });

  app.get("/interaction/:uid/abort", async (req, res) => {
    // redirect to client/callback
    const { params } = await provider.interactionDetails(req, res);
    const redirectUri = params?.redirect_uri;
    if (redirectUri) {
      return res.redirect(params.redirect_uri);
    }

    return notFound(req, res);
  });

  // app.use((req, res) => res.status(404).send("NOT FOUND."));
}
